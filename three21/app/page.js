'use client';

import Link from "next/link";
import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { 
  Upload, 
  Smile, 
  ArrowRight, 
  Zap, 
  Eye, 
  Image, 
  Loader
} from 'react-feather';


// Dynamic import for the embedded demo viewer
const EmbeddedDemoViewer = dynamic(() => import('../components/EmbeddedDemoViewer'), {
  ssr: false,
  loading: () => (
    <div className="demo-loading-placeholder">
      <div className="loading-spinner">
        <Loader className="w-8 h-8 text-accent animate-spin" />
      </div>
    </div>
  )
});

export default function Home() {
  const [isAssembled, setIsAssembled] = useState(true);

  useEffect(() => {
    // Load Vanta.js scripts
    const loadVanta = () => {
      if (typeof window !== 'undefined' && window.VANTA && window.THREE) {
        window.VANTA.FOG({
          el: "#vanta-bg",
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          highlightColor: 0x5363,
          midtoneColor: 0x20459d,
          lowlightColor: 0x4021a4,
          baseColor: 0x0,
          blurFactor: 0.90,
          speed: 3.70,
          zoom: 0.40
        });
      }
    };

    // Add Three.js script
    const threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    threeScript.onload = () => {
      // Add Vanta fog script after Three.js loads
      const vantaScript = document.createElement('script');
      vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js';
      vantaScript.onload = loadVanta;
      document.head.appendChild(vantaScript);
    };
    document.head.appendChild(threeScript);

    return () => {
      // Cleanup Vanta on unmount
      if (window.VANTA) {
        window.VANTA.current && window.VANTA.current.destroy();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Vanta Fog Background */}
      <div id="vanta-bg" className="vanta-background"></div>

      {/* Content Overlay */}
      <div className="content-overlay">
        <div className="container py-16">
          {/* Header */}
          <header className="text-center mb-16 animate-fadeIn">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary mb-6">
              Three21
            </h1>
            <p className="text-lg md:text-xl text-secondary max-w-3xl mx-auto">
              Advanced 3D model visualization and analysis platform. Upload, explore, and dissect your 3D models with cutting-edge technology.
            </p>
          </header>

          {/* Bento Grid Layout */}
          <div className="main-bento-grid mb-16">
            {/* Main CTA Card */}
            <div className="main-cta-card card p-8 flex flex-col justify-between">
              <div>
                <div className="feature-icon feature-icon-primary mb-6" aria-hidden="true">
                  <Upload size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                  Start Exploring
                </h2>
                <p className="cta-description text-secondary mb-8">
                  Upload your 3D models and experience next-generation visualization. Support for GLB, GLTF, FBX, and more formats with real-time rendering capabilities.
                </p>
                <Link
                  href="/import-model"
                  className="upload-button-container"
                >
                  <button className="btn-upload btn-upload-active" aria-label="Upload 3D model">
                    <Upload className="btn-icon" size={16} aria-hidden="true" />
                    <span className="btn-text">Upload Model</span>
                    <ArrowRight className="btn-icon" size={16} aria-hidden="true" />
                  </button>
                </Link>
                
                {/* Demo Link */}
                <Link
                  href="/model?type=demo"
                  className="demo-link-container "
                >
                  <button className="btn-demo" aria-label="Try demo model">
                    <Smile className="btn-icon" size={16} aria-hidden="true" />
                    <span className="btn-text">Try Demo</span>
                  </button>
                </Link>
              </div>

              <Suspense fallback={
                <div className="demo-loading-placeholder">
                  <div className="loading-spinner">
                    <Loader className="w-8 h-8 text-accent animate-spin" />
                  </div>
                </div>
              }>
                <EmbeddedDemoViewer
                  isAssembled={isAssembled}
                  onAssembleChange={setIsAssembled}
                />
              </Suspense>

              {/* <div className="spline-viewer">
                <Spline
                  scene="https://prod.spline.design/rBa4faxZCxx91uYO/scene.splinecode"
                />
              </div> */}

            </div>

            {/* Live Demo Section with 3D Model */}
            {/* <div className="demo-section-card card p-6">
              <div className="demo-header mb-4">
                <div className="feature-icon feature-icon-secondary mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Live Demo</h3>
                <p className="text-secondary text-sm mb-4">Interactive 3D model experience with assemble/disassemble controls</p>
              </div>

              <div className="demo-viewer-container">

              </div>
            </div> */}

            {/* Feature Cards */}
            <div className="features-container">
              <div className="bento-feature card p-6">
                <div className="feature-icon feature-icon-secondary mb-4" aria-hidden="true">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3">Real-time Rendering</h3>
                <p className="text-secondary">
                  High-performance WebGL rendering with advanced lighting, shadows, and materials for stunning visual quality.
                </p>
              </div>

              <div className="bento-feature card p-6">
                <div className="feature-icon feature-icon-info mb-4" aria-hidden="true">
                  <Eye size={24} />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3">Interactive Analysis</h3>
                <p className="text-secondary">
                  Inspect models with advanced tools, layer management, and precise dissection capabilities for detailed examination.
                </p>
              </div>

              <div className="bento-feature card p-6">
                <div className="feature-icon feature-icon-success mb-4" aria-hidden="true">
                  <Image size={24} />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3">Multi-format Support</h3>
                <p className="text-secondary">
                  GLB and FBX for now. Seamless format conversion and optimization for all your 3D assets. future updates will include OBJ, STL, and more.
                </p>
              </div>

              <div className="bento-feature card p-6">
                <div className="feature-icon feature-icon-primary mb-4" aria-hidden="true">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3">AI-Powered Insights</h3>
                <p className="text-secondary">
                  Get intelligent analysis, optimization suggestions, and automated reports for your 3D models.
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="card p-8 mb-16">
            <div className="stats-grid">
              <div>
                <div className="stat-number stat-number-primary">2</div>
                <div className="text-lg text-secondary">Supported Formats</div>
              </div>
              <div>
                <div className="stat-number stat-number-secondary">Real-time</div>
                <div className="text-lg text-secondary">Rendering Engine</div>
              </div>
              <div>
                <div className="stat-number stat-number-success">Advanced</div>
                <div className="text-lg text-secondary">Analysis Tools</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-secondary text-lg">
            <p>Built with love by Avni & Amon with Three.js, Next.js, and WebGL</p>
          </footer>
        </div>
      </div>

      <style jsx>{`
        /* Upload Button Container */
        .upload-button-container {
          position: absolute;
          bottom: 2rem;
          left: 2rem;
          z-index: 100;
          text-decoration: none;
        }

        /* Demo Link Container */
        .demo-link-container {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          z-index: 100;
          text-decoration: none;
        }

        /* Demo Button */
        .btn-demo {
          margin-left: 1rem;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 3rem;
          padding: 0 1.5rem;
          border: 1px solid var(--border);
          background: var(--secondary);
          color: var(--secondary-foreground);
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 500;
          font-family: inherit;
          text-decoration: none;
          outline: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          user-select: none;
          white-space: nowrap;
          min-width: 140px;
        }

        .btn-demo:focus-visible {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
        }

        .btn-demo:hover:not(:disabled) {
          background: var(--secondary-accent);
          color: white;
          border-color: var(--secondary-accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(var(--secondary-rgb), 0.15);
        }

        /* Beautiful Upload Button - Same as Demo Viewer */
        .btn-upload {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 3rem;
          padding: 0 1.5rem;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--foreground);
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 500;
          font-family: inherit;
          text-decoration: none;
          outline: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          user-select: none;
          white-space: nowrap;
          min-width: 200px;
        }

        .btn-upload:focus-visible {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
        }

        .btn-upload::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
          z-index: 1;
        }

        .btn-upload:hover:not(:disabled) {
          background: var(--accent);
          color: var(--accent-foreground);
          border-color: var(--primary-accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.15);
        }

        .btn-upload:hover:not(:disabled)::before {
          left: 100%;
        }

        .btn-upload-active {
          background: var(--gradient-primary);
          color: var(--primary-foreground);
          border-color: var(--primary-accent);
          box-shadow: 0 4px 14px var(--primary-shadow);
          transform: translateY(-1px);
        }

        .btn-upload-active:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--primary-hover) 0%, #1d4ed8 100%);
          box-shadow: 0 6px 20px var(--primary-shadow);
          transform: translateY(-2px);
        }

        .btn-upload:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: var(--muted);
          color: var(--muted-foreground);
          border-color: var(--border);
          transform: none;
          box-shadow: none;
          pointer-events: none;
        }

        .btn-upload:disabled::before {
          display: none;
        }

        .btn-icon {
          width: 1rem;
          height: 1rem;
          stroke-width: 2;
          flex-shrink: 0;
          position: relative;
          z-index: 2;
        }

        .btn-text {
          font-weight: 600;
          letter-spacing: 0.025em;
          position: relative;
          z-index: 2;
        }

        /* Vanta Fog Background */
        .vanta-background {
          position: absolute;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
        }

        .content-overlay {
          position: relative;
          z-index: 10;
          min-height: 100vh;
        }

        /* Main Bento Grid for CTA and Demo */
        .main-bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-bottom: 4rem;
        }

        @media (min-width: 1024px) {
          .main-bento-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto;
            grid-template-areas: 
              "main-cta"
              "features";
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .main-bento-grid {
            grid-template-areas: 
              "main-cta main-cta"
              "demo demo"
              "features features";
          }
        }

        .main-cta-card {
          display: flex;
          width: 100%;
          flex-direction: row;
          justify-content: space-between;
          min-height: 400px;
          position: relative;
          overflow: hidden;
        }

        /* Demo Section Styles */
        .demo-section-card {
          min-height: 400px;
          display: flex;
          flex-direction: column;
          grid-area: demo;
        }

        /* Feature Cards Container */
        .features-container {
          grid-area: features;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 1rem;
        }

        /* Feature Cards with Equal Width */
        .bento-feature {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
        }

        .demo-viewer-container {
          flex: 1;
          min-height: 300px;
          border-radius: 8px;
          overflow: hidden;
          background: transparent; /* Transparent background */
          position: relative;
          border: 1px solid var(--border);
        }

        .demo-loading-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 300px;
          background: transparent; /* Transparent background */
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .loading-spinner {
          color: var(--primary-accent);
        }

        /* Features Grid */
        .features-showcase {
          text-align: center;
          margin-bottom: 4rem;
        }

        .features-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--foreground);
          margin-bottom: 3rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .feature-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .feature-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
        }

        .feature-icon-small {
          width: 3rem;
          height: 3rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
          color: white;
        }

        .feature-icon-small svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .feature-item h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--foreground);
          margin: 0 0 1rem 0;
        }

        .feature-item p {
          color: var(--muted-foreground);
          line-height: 1.6;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 1023px) {
          .main-bento-grid {
            grid-template-columns: 1fr;
            grid-template-areas: 
              "demo"
              "main-cta"
              "features";
          }
          
          .demo-section-card {
            order: -1;
          }

          .features-container {
            grid-template-columns: repeat(2, 1fr);
          }

          .upload-button-container {
            bottom: 1.5rem;
            left: 1.5rem;
          }

          .btn-upload {
            min-width: 180px;
            height: 2.75rem;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 768px) {
        .btn-demo{
        margin-left: 0;
        margin-top: 1rem;}
        .main-cta-card{
        flex-direction: column;
        min-height: 1000px;
        }
          .content-overlay {
            background: rgba(0, 0, 0, 0.5);
          }

          .features-title {
            font-size: 2rem;
          }
          
          .demo-viewer-container {
            min-height: 250px;
          }

          .demo-loading-placeholder {
            min-height: 250px;
          }

          .features-container {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .bento-feature {
            min-height: 150px;
          }

          .upload-button-container {
            bottom: 1rem;
            left: 1rem;
            right: 1rem;
            position: absolute;
          }

          .demo-link-container {
            bottom: 1rem;
            right: 1rem;
            position: absolute;
            display: none; /* Hide demo button on mobile to avoid overlap */
          }

          .btn-upload {
            width: 100%;
            min-width: auto;
            height: 3.25rem;
            font-size: 1rem;
            padding: 0 1rem;
          }
        }
        
        /* Ensure Vanta background is responsive */
        .vanta-background canvas {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
