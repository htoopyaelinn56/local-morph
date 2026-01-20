import { useState } from 'react';
import './App.css'; // Ensure this exists, though we mostly used index.css

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState('png');

    const formats = ['png', 'jpeg', 'jpg', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'tga', 'ff'];

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

            <nav className="navbar">
                <div className="logo">
                    <span className="logo-icon">⚡</span> LocalMorph
                </div>
                <div className="nav-links">
                    <a href="#">About</a>
                    <a href="#" className="active">Tools</a>
                    <button className="neo-button-small">Github</button>
                </div>
            </nav>

            <main className="main-content">
                <div className="hero-text">
                    <h1>TRANSFORM YOUR <span className="highlight">IMAGES</span></h1>
                    <p>Super fast. Super simple. Super Secure.</p>
                </div>

                <div className="converter-card neo-box">
                    {/* Badge */}
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

                        {/* Controls */}
                        <div className="controls-row">
                            <div className="control-group">
                                <label>Convert to:</label>
                                <select
                                    className="neo-select"
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                >
                                    {formats.map((f) => (
                                        <option key={f} value={f}>{f.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <button className="neo-button cta-button">
                                Start Converting <span>🚀</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Feature Grid (Like the bottom part of your ref image) */}
                <div className="features-grid">
                    <div className="feature-card neo-box pink">
                        <h3>⚡ Fast</h3>
                        <p>Browser-based conversion.</p>
                    </div>
                    <div className="feature-card neo-box blue">
                        <h3>🔒 Secure</h3>
                        <p>Files never leave your device.</p>
                    </div>
                    <div className="feature-card neo-box green">
                        <h3>✨ Free</h3>
                        <p>No watermarks. Ever.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;