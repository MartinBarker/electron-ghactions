const { ipcRenderer } = window.require('electron');
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Plus, Library, Settings, Minus, Square, X, Maximize2 } from 'lucide-react';
import styles from './Frame2.module.css';
import { ReactComponent as RenderTuneIcon } from '../../Icons/icon-white.svg';

const Frame2 = ({ children, pageTitle }) => {
    const [windowStatus, setWindowStatus] = useState('init');

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
            {/* RenderTune Icon */}
            <div className={styles.iconContainer}>
                <RenderTuneIcon className={styles.logoIcon} />
            </div>

            {/* Titlebar */}
            <header className={styles.titlebar}>
                <div className={styles.dragRegion}>
                    <span className={styles.windowTitle}>{pageTitle}</span>
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
            </header>

            {/* Main content with sidebar */}
            <div className={styles.mainContent}>
                <aside className={styles.sidebar}>

                    <Link to="/" className={styles.sidebarItem} title="Home">
                        <Home size={24} color="white" />
                    </Link>


                    <Link to="/add" className={styles.sidebarItem} title="Add">
                        <Plus size={24} color="white" />
                    </Link>

                    <Link to="/library" className={styles.sidebarItem} title="Library">
                        <Library size={24} color="white" />
                    </Link>

                    <Link to="/settings" className={styles.sidebarItem} title="Settings">
                        <Settings size={24} color="white" />
                    </Link>

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
