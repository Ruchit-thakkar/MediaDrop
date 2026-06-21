const ALPHA_THRESHOLD = 0.002;
const MAX_ALPHA = 0.99;
const LOGO_VALUE = 255;

export function calculateAlphaMap(bgCaptureImageData) {
    const { width, height, data } = bgCaptureImageData;
    const alphaMap = new Float32Array(width * height);
    for (let i = 0; i < alphaMap.length; i++) {
        const idx = i * 4;
        // Normalize max channel to 0-1
        alphaMap[i] = Math.max(data[idx], data[idx + 1], data[idx + 2]) / 255.0;
    }
    return alphaMap;
}

export function removeWatermark(imageData, alphaMap, position) {
    const { x, y, width, height } = position;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const imgIdx = ((y + row) * imageData.width + (x + col)) * 4;
            const alphaIdx = row * width + col;
            
            let alpha = alphaMap[alphaIdx];
            if (alpha < ALPHA_THRESHOLD) continue;
            alpha = Math.min(alpha, MAX_ALPHA);

            for (let c = 0; c < 3; c++) {
                const watermarked = imageData.data[imgIdx + c];
                // Reverse Alpha Blending Formula
                const original = (watermarked - alpha * LOGO_VALUE) / (1.0 - alpha);
                imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
            }
        }
    }
}

export class WatermarkEngine {
    constructor(bg48, bg96) {
        this.bg48 = bg48;
        this.bg96 = bg96;
        this.alphaMaps = {};
    }

    static async create() {
        const loadImage = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = src;
        });

        try {
            const [bg48, bg96] = await Promise.all([
                loadImage('/watermark/bg_48.png'),
                loadImage('/watermark/bg_96.png')
            ]);
            return new WatermarkEngine(bg48, bg96);
        } catch (e) {
            console.error("Failed to load watermark reference assets.", e);
            throw e;
        }
    }

    getWatermarkInfo(width, height) {
        const isLarge = width > 1024 && height > 1024;
        const size = isLarge ? 96 : 48;
        const margin = isLarge ? 64 : 32;
        
        return {
            size,
            x: width - margin - size,
            y: height - margin - size,
            width: size, 
            height: size
        };
    }

    async getAlphaMap(size) {
        if (this.alphaMaps[size]) return this.alphaMaps[size];
        
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(size === 48 ? this.bg48 : this.bg96, 0, 0);
        
        const map = calculateAlphaMap(ctx.getImageData(0, 0, size, size));
        this.alphaMaps[size] = map;
        return map;
    }

    async getTemplateData(size) {
        const key = `tmpl_${size}`;
        if (this[key]) return this[key];

        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(size === 48 ? this.bg48 : this.bg96, 0, 0);

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;
        const tmpl = new Float32Array(size * size);

        let maxVal = 0;
        for (let i = 0; i < size * size; i++) {
            const idx = i * 4;
            const val = Math.max(data[idx], data[idx + 1], data[idx + 2]) / 255.0;
            tmpl[i] = val;
            if (val > maxVal) maxVal = val;
        }

        if (maxVal > 0) {
            for (let i = 0; i < size * size; i++) {
                tmpl[i] /= maxVal;
            }
        }

        this[key] = tmpl;
        return tmpl;
    }

    async analyze(imageFile) {
        const objectUrl = URL.createObjectURL(imageFile);
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i); 
            i.onerror = (err) => reject(err);
            i.src = objectUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Search region bottom-right (max 400x400)
        const sw = Math.min(canvas.width, 400);
        const sh = Math.min(canvas.height, 400);
        const startX = canvas.width - sw;
        const startY = canvas.height - sh;

        // Grayscale conversion of search region
        const regionGray = new Float32Array(sw * sh);
        for (let y = 0; y < sh; y++) {
            const imgRowStart = (startY + y) * canvas.width;
            const regionRowStart = y * sw;
            for (let x = 0; x < sw; x++) {
                const imgIdx = (imgRowStart + (startX + x)) * 4;
                const r = imageData.data[imgIdx];
                const g = imageData.data[imgIdx + 1];
                const b = imageData.data[imgIdx + 2];
                regionGray[regionRowStart + x] = (r + g + b) / 3.0;
            }
        }

        const sizes = [48, 96];
        let bestOverall = {
            size: 48,
            x: canvas.width - 48 - 32, // default fallback x
            y: canvas.height - 48 - 32, // default fallback y
            confidence: -1,
            detected: false
        };

        for (const size of sizes) {
            if (canvas.width < size || canvas.height < size) continue;

            const tmpl = await this.getTemplateData(size);
            const N = size * size;

            // Template stats
            let sum_t = 0;
            let sum_t2 = 0;
            for (let i = 0; i < N; i++) {
                sum_t += tmpl[i];
                sum_t2 += tmpl[i] * tmpl[i];
            }
            const tmpl_mean = sum_t / N;
            const tmpl_var = (sum_t2 / N) - (tmpl_mean * tmpl_mean);
            const tmpl_std = Math.sqrt(Math.max(0, tmpl_var));

            // Downsampled stats (step=4) for fast coarse search
            const subStep = 4;
            let sum_t_down = 0;
            let sum_t2_down = 0;
            let count_down = 0;
            for (let dy = 0; dy < size; dy += subStep) {
                const rowIdx = dy * size;
                for (let dx = 0; dx < size; dx += subStep) {
                    const t = tmpl[rowIdx + dx];
                    sum_t_down += t;
                    sum_t2_down += t * t;
                    count_down++;
                }
            }
            const tmpl_mean_down = sum_t_down / count_down;
            const tmpl_var_down = (sum_t2_down / count_down) - (tmpl_mean_down * tmpl_mean_down);
            const tmpl_std_down = Math.sqrt(Math.max(0, tmpl_var_down));

            const getCorrelationCoarse = (x_local, y_local) => {
                let sum_p = 0;
                let sum_p2 = 0;
                let sum_pt = 0;
                for (let dy = 0; dy < size; dy += subStep) {
                    const rowIdx = (y_local + dy) * sw;
                    const tmplRowIdx = dy * size;
                    for (let dx = 0; dx < size; dx += subStep) {
                        const p = regionGray[rowIdx + (x_local + dx)];
                        const t = tmpl[tmplRowIdx + dx];
                        sum_p += p;
                        sum_p2 += p * p;
                        sum_pt += p * t;
                    }
                }
                const mean_p = sum_p / count_down;
                const var_p = (sum_p2 / count_down) - (mean_p * mean_p);
                const std_p = Math.sqrt(Math.max(0, var_p));
                if (std_p <= 0.1 || tmpl_std_down <= 0) return -1;

                const mean_pt = sum_pt / count_down;
                const covariance = mean_pt - mean_p * tmpl_mean_down;
                return covariance / (std_p * tmpl_std_down);
            };

            const getCorrelationFine = (x_local, y_local) => {
                let sum_p = 0;
                let sum_p2 = 0;
                let sum_pt = 0;
                for (let dy = 0; dy < size; dy++) {
                    const rowIdx = (y_local + dy) * sw;
                    const tmplRowIdx = dy * size;
                    for (let dx = 0; dx < size; dx++) {
                        const p = regionGray[rowIdx + (x_local + dx)];
                        const t = tmpl[tmplRowIdx + dx];
                        sum_p += p;
                        sum_p2 += p * p;
                        sum_pt += p * t;
                    }
                }
                const mean_p = sum_p / N;
                const var_p = (sum_p2 / N) - (mean_p * mean_p);
                const std_p = Math.sqrt(Math.max(0, var_p));
                if (std_p <= 0.1 || tmpl_std <= 0) return -1;

                const mean_pt = sum_pt / N;
                const covariance = mean_pt - mean_p * tmpl_mean;
                return covariance / (std_p * tmpl_std);
            };

            // Coarse search
            let bestCorr = -1;
            let bestX = 0;
            let bestY = 0;
            const step = 8;
            for (let y = 0; y <= sh - size; y += step) {
                for (let x = 0; x <= sw - size; x += step) {
                    const corr = getCorrelationCoarse(x, y);
                    if (corr > bestCorr) {
                        bestCorr = corr;
                        bestX = x;
                        bestY = y;
                    }
                }
            }

            // Fine search (local neighborhood)
            const searchRange = 8;
            const startScanY = Math.max(0, bestY - searchRange);
            const endScanY = Math.min(sh - size, bestY + searchRange);
            const startScanX = Math.max(0, bestX - searchRange);
            const endScanX = Math.min(sw - size, bestX + searchRange);

            for (let y = startScanY; y <= endScanY; y++) {
                for (let x = startScanX; x <= endScanX; x++) {
                    const corr = getCorrelationFine(x, y);
                    if (corr > bestCorr) {
                        bestCorr = corr;
                        bestX = x;
                        bestY = y;
                    }
                }
            }

            if (bestCorr > bestOverall.confidence) {
                bestOverall = {
                    size,
                    x: startX + bestX,
                    y: startY + bestY,
                    confidence: bestCorr,
                    detected: bestCorr >= 0.4
                };
            }
        }

        if (!bestOverall.detected) {
            // Fallback default
            const isLarge = canvas.width > 1024 && canvas.height > 1024;
            const size = isLarge ? 96 : 48;
            const margin = isLarge ? 64 : 32;
            bestOverall = {
                size,
                x: canvas.width - margin - size,
                y: canvas.height - margin - size,
                confidence: Math.max(0, bestOverall.confidence),
                detected: false
            };
        }

        return {
            ...bestOverall,
            originalSrc: objectUrl,
            width: img.width,
            height: img.height,
            canvas,
            ctx,
            imageData
        };
    }

    async restore(analysisResult) {
        const { size, x, y, canvas, ctx, imageData } = analysisResult;

        const alphaMap = await this.getAlphaMap(size);
        const position = { size, x, y, width: size, height: size };

        const freshImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        removeWatermark(freshImageData, alphaMap, position);
        ctx.putImageData(freshImageData, 0, 0);

        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));

        return {
            blob,
            width: canvas.width,
            height: canvas.height
        };
    }

    async process(imageFile) {
        const analysis = await this.analyze(imageFile);
        const restoration = await this.restore(analysis);
        return {
            blob: restoration.blob,
            originalSrc: analysis.originalSrc,
            width: restoration.width,
            height: restoration.height
        };
    }
}
