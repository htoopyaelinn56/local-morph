import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { convert_image } from '../public/wasm/native';
import init from '../public/wasm/native.js';
import { SUPPORTED_FORMATS, type SupportedFormat, normalizeFormat } from './formats';

type AppProps = {
    initialTargetFormat?: SupportedFormat | null;
    initialSourceFormat?: SupportedFormat | null;
};

function App({ initialTargetFormat }: AppProps) {
    const [file, setFile] = useState<File | null>(null);
    const initialFormat = normalizeFormat(initialTargetFormat) ?? 'jpg';
    const [format, setFormat] = useState<SupportedFormat>(initialFormat);
    const [isOpen, setIsOpen] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wasmReady, setWasmReady] = useState(false);
    const [wasmError, setWasmError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const formats = SUPPORTED_FORMATS;

    // Initialize WASM after first frame (background loading)
    useEffect(() => {
        // Use requestAnimationFrame to ensure UI renders first
        requestAnimationFrame(() => {
            init()
                .then(() => {
                    setWasmReady(true);
                    console.log('WASM module initialized successfully');
                })
                .catch((err) => {
                    console.error('Failed to initialize WASM:', err);
                    setWasmError('Failed to load converter module. Please refresh the page.');
                });
        });
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'png': return '🖼️';
            case 'jpg':
            case 'jpeg': return '📸';
            case 'gif': return '👾';
            case 'webp': return '🌐';
            case 'ico': return '✨';
            case 'bmp': return '🎨';
            default: return '📄';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError(null); // Clear any previous errors
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
            setError(null); // Clear any previous errors
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleConvert = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        if (!wasmReady) {
            setError('Converter is still loading. Please wait a moment and try again.');
            return;
        }

        setIsConverting(true);
        setError(null);

        try {
            // Read file using FileReader (more compatible with mobile browsers)
            // This avoids permission issues on Android Chrome
            const inputData = await new Promise<Uint8Array>((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = (e) => {
                    if (e.target?.result) {
                        const arrayBuffer = e.target.result as ArrayBuffer;
                        resolve(new Uint8Array(arrayBuffer));
                    } else {
                        reject(new Error('Failed to read file'));
                    }
                };

                reader.onerror = () => {
                    reject(new Error('File reading failed. Please try selecting the file again.'));
                };

                reader.readAsArrayBuffer(file);
            });

            // Call WASM function to convert image
            const outputData = convert_image(inputData, format);

            // Create blob from output data
            // @ts-expect-error/blob
            const blob = new Blob([outputData.buffer], { type: `image/${format}` });

            // Generate download URL
            const url = URL.createObjectURL(blob);

            // Create temporary anchor element to trigger download
            const a = document.createElement('a');
            a.href = url;

            // Generate output filename (keep original name but change extension)
            const originalName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
            a.download = `${originalName}.${format}`;

            // Trigger download
            document.body.appendChild(a);
            a.click();

            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Conversion error:', err);
            setError(err instanceof Error ? err.message : 'Failed to convert image');
        } finally {
            // dummy await 500ms to show converting state
            await new Promise(res => setTimeout(res, 500));
            setIsConverting(false);
        }
    };

    return (
        <div className="app-container">
            {/* Background Decorative Shapes */}
            <div className="shape circle-shape"></div>
            <div className="shape triangle-shape"></div>
            <div className="shape box-shape"></div>

            {/* Navigation */}
            <nav className="navbar">
                <div className="logo">
                    <img src="/local_morph.svg" alt="LocalMorph" className="logo-icon" /> LocalMorph
                </div>
                <div className="nav-links">
                    <button className="neo-button-small">Report</button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                <div className="hero-text">
                    <h1>TRANSFORM YOUR <span className="highlight">IMAGES</span></h1>
                    <p>Super fast. Super simple. Super secure.</p>
                </div>

                {/* Conversion Card */}
                <div className="converter-card">
                    <div className="card-badge"> Available for Images </div>

                    <div className="card-content">
                        {/* Upload Area */}
                        <div
                            className={`upload-zone ${file ? 'has-file' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden-input"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {file ? (
                                <div className="file-preview">
                                    <div className="icon-wrapper">📄</div>
                                    <div className="file-info">
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                    <button onClick={() => setFile(null)} className="remove-btn">✕</button>
                                </div>
                            ) : (
                                <label htmlFor="file-upload" className="upload-label">
                                    <div className="upload-icon">📂</div>
                                    <h3>Drag & Drop or Click</h3>
                                    <p>Supports PNG, JPG, WEBP & more</p>
                                </label>
                            )}
                        </div>

                        {/* Controls Row */}
                        <div className="controls-row">

                            {/* Custom Reference Style Dropdown */}
                            <div className="control-group">
                                <label>Convert to:</label>
                                <div className="custom-select-container" ref={dropdownRef}>
                                    {/* Trigger */}
                                    <div
                                        className="custom-select-trigger"
                                        onClick={() => setIsOpen(!isOpen)}
                                    >
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span>{getIcon(format)}</span>
                                            <span>{format.toUpperCase()}</span>
                                        </div>
                                        <svg
                                            className={`arrow-icon ${isOpen ? "rotate-180" : ""}`}
                                            width="14" height="14" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" strokeWidth="3"
                                            strokeLinecap="round" strokeLinejoin="round"
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </div>

                                    {/* Floating Menu */}
                                    {isOpen && (
                                        <div className="custom-options-list">
                                            {formats.map((f) => (
                                                <div
                                                    key={f}
                                                    className={`custom-option ${format === f ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setFormat(f);
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.2rem' }}>{getIcon(f)}</span>
                                                    <span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                className="neo-button cta-button"
                                onClick={handleConvert}
                                disabled={!file || isConverting || !wasmReady}
                            >
                                {isConverting ? (
                                    <>Converting... <span>⏳</span></>
                                ) : !wasmReady ? (
                                    <>Loading... <span>⏳</span></>
                                ) : (
                                    <>Start Converting <span>🚀</span></>
                                )}
                            </button>
                        </div>

                        {/* Error Display */}
                        {(error || wasmError) && (
                            <div className="error-message" style={{
                                marginTop: '1rem',
                                padding: '0.75rem 1rem',
                                backgroundColor: '#fee',
                                border: '2px solid #f88',
                                borderRadius: '8px',
                                color: '#c00',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                ❌ {error || wasmError}
                            </div>
                        )}
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="features-grid">
                    <div className="feature-card pink">
                        <h3>⚡ Fast</h3>
                        <p>Browser-based.</p>
                    </div>
                    <div className="feature-card blue">
                        <h3>🔒 Secure</h3>
                        <p>Local processing.</p>
                    </div>
                    <div className="feature-card green">
                        <h3>✨ Free</h3>
                        <p>No watermarks.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;

