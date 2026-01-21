import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState('png');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const formats = ['png', 'jpeg', 'jpg', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'tga', 'ff'];

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
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
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
                    <span className="logo-icon">⚡</span> LocalMorph
                </div>
                <div className="nav-links">
                    <button className="neo-button-small">About</button>
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
                    <div className="card-badge">
                        Available for Images
                    </div>

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
                            <button className="neo-button cta-button">
                                Start Converting <span>🚀</span>
                            </button>
                        </div>
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