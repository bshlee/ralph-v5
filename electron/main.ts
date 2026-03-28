import path from "node:path";
import { app, BrowserWindow } from "electron";
import { initDatabase } from "./db/database";
import { seedContexts } from "./db/seed";
import { registerContextHandlers } from "./ipc/contexts";
import { registerGenerationHandlers } from "./ipc/generation";
import { registerInjectionHandlers } from "./ipc/injection";
import { registerInterviewHandlers } from "./ipc/interview";
import { registerOnboardingHandlers } from "./ipc/onboarding";
import {
	registerGlobalShortcut,
	unregisterGlobalShortcut,
} from "./ipc/shortcut";
import { createTray } from "./tray";

const DIST_PATH = path.join(__dirname, "../dist");

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let isQuitting = false;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 900,
		height: 670,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	mainWindow.on("ready-to-show", () => {
		mainWindow?.show();
	});

	// Hide instead of close — app stays in tray
	mainWindow.on("close", (e) => {
		if (!isQuitting) {
			e.preventDefault();
			mainWindow?.hide();
		}
	});

	if (VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(path.join(DIST_PATH, "index.html"));
	}
}

function createOverlayWindow() {
	overlayWindow = new BrowserWindow({
		width: 420,
		height: 380,
		show: false,
		frame: false,
		transparent: true,
		alwaysOnTop: true,
		skipTaskbar: true,
		resizable: false,
		hasShadow: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

	if (VITE_DEV_SERVER_URL) {
		overlayWindow.loadURL(`${VITE_DEV_SERVER_URL}#overlay`);
	} else {
		overlayWindow.loadFile(path.join(DIST_PATH, "index.html"), {
			hash: "overlay",
		});
	}
}

export function getMainWindow() {
	return mainWindow;
}

export function getOverlayWindow() {
	return overlayWindow;
}

app.on("before-quit", () => {
	isQuitting = true;
});

app.on("window-all-closed", () => {
	// On macOS, keep the app running in the menu bar via tray
});

app.on("will-quit", () => {
	unregisterGlobalShortcut();
});

app.whenReady().then(() => {
	const db = initDatabase();
	seedContexts(db);
	registerContextHandlers(getOverlayWindow);
	registerGenerationHandlers(getOverlayWindow);
	registerInjectionHandlers(getOverlayWindow);
	registerInterviewHandlers();
	registerOnboardingHandlers();
	createTray(getMainWindow);
	createMainWindow();
	createOverlayWindow();
	registerGlobalShortcut(getOverlayWindow);
});
