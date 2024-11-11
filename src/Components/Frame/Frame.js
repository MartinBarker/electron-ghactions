const { ipcRenderer } = window.require('electron');
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Plus, Library, Minus, Square, X, Maximize2 } from 'lucide-react';
import styles from './Frame2.module.css';

const Frame2 = ({ children, pageTitle }) => {
    const [windowStatus, setWindowStatus] = useState('init');
    
    const sidebarItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Plus, label: 'Add', path: '/add' },
        { icon: Library, label: 'Library', path: '/library' }
    ];

    function minimizeWindow() {
        ipcRenderer.send('minimize-window');
    }

    function maximizeWindow() {
        ipcRenderer.send('maximize-window');
        setWindowStatus('maximized');
    }

    function unmaximizeWindow() {
        ipcRenderer.send('unmaximize-window');
        setWindowStatus('init');
    }

    function closeWindow() {
        ipcRenderer.send('close-window');
    }

    return (
        <div className={styles.container}>
            {/* Titlebar */}
            <header className={styles.titlebar}>
                <div className={styles.dragRegion}>
                    <div className={styles.titlebarIconContainer}>
                        <img 
                            src={process.env.PUBLIC_URL + '/icon-white.svg'} 
                            alt="App Icon"
                            className={styles.titlebarIcon}
                        />
                        <span className={styles.windowTitle}>
                            Your App Title
                        </span>
                    </div>
                    <div className={styles.windowControls}>
                        <button 
                            className={styles.controlButton} 
                            onClick={minimizeWindow}
                            title="Minimize"
                        >
                            <Minus size={18} />
                        </button>

                        {windowStatus === 'init' ? (
                            <button 
                                className={styles.controlButton} 
                                onClick={maximizeWindow}
                                title="Maximize"
                            >
                                <Square size={18} />
                            </button>
                        ) : (
                            <button 
                                className={styles.controlButton} 
                                onClick={unmaximizeWindow}
                                title="Restore Down"
                            >
                                <Maximize2 size={18} />
                            </button>
                        )}

                        <button 
                            className={`${styles.controlButton} ${styles.closeButton}`}
                            onClick={closeWindow}
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content with sidebar */}
            <div className={styles.mainContent}>
                <aside className={styles.sidebar}>
                    {sidebarItems.map((item) => (
                        <Link 
                            key={item.label}
                            to={item.path}
                            className={styles.sidebarItem}
                            title={item.label}
                        >
                            <item.icon size={24} />
                        </Link>
                    ))}
                </aside>
                <main className={styles.content}>
                    {pageTitle && (
                        <h1 className={styles.pageTitle}>{pageTitle}</h1>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Frame2;