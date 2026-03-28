import type { BrowserWindow } from "electron";
import { app, Menu, nativeImage, Tray } from "electron";

let tray: Tray | null = null;

// 22x22 star template icon (black on transparent) embedded as base64 PNG
const TRAY_ICON_1X =
	"iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAARklEQVR4nGNgGAVkgv9DyuD/SHjwG/wfC6aqYbgw1Q0k2QKaGEqO4SQDmhhKjOE0MZQiw+liMDHiJBlMiTxFmmhWlA4TAABrj2qWSkrPcwAAAABJRU5ErkJggg==";
const TRAY_ICON_2X =
	"iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAAhUlEQVR4nO3VywqAMAxE0f7/T8eV4KKISfOYkbmQXSWnUHAtpdRvsmmANyqwPYYiKrBtBjqBK9thodFU4DcsJBoS/AUVHWhc2SWosJPolGigXeiyqLAV6LaosHdU2OUEjoPpnoTAAjuw0bNlRZbDgSu/O+50YSs4c1ELOnvByF9PKaVAugD/CqZoSI47qgAAAABJRU5ErkJggg==";

function createTrayIcon(): Electron.NativeImage {
	const icon = nativeImage.createFromDataURL(
		`data:image/png;base64,${TRAY_ICON_1X}`,
	);
	const icon2x = nativeImage.createFromDataURL(
		`data:image/png;base64,${TRAY_ICON_2X}`,
	);
	icon.addRepresentation({ scaleFactor: 2, dataURL: icon2x.toDataURL() });
	icon.setTemplateImage(true);
	return icon;
}

export function createTray(getMainWindow: () => BrowserWindow | null): Tray {
	const icon = createTrayIcon();

	tray = new Tray(icon);
	tray.setToolTip("Your *");

	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Open Your *",
			click: () => {
				const win = getMainWindow();
				if (win) {
					win.show();
					win.focus();
				}
			},
		},
		{ type: "separator" },
		{
			label: "Quit",
			click: () => {
				app.quit();
			},
		},
	]);

	tray.setContextMenu(contextMenu);

	tray.on("click", () => {
		const win = getMainWindow();
		if (win) {
			if (win.isVisible()) {
				win.focus();
			} else {
				win.show();
				win.focus();
			}
		}
	});

	return tray;
}

export function getTray() {
	return tray;
}
