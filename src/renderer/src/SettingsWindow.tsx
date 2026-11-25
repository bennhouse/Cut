// Cut: the Settings window (a separate BrowserWindow loading this renderer with #settings), like the
// settings windows of the other apps in the suite. It edits the same config store as the main window;
// useUserSettingsRoot keeps both in step. Buttons that open something in the main window (value
// tuners, keyboard shortcuts, cleanup choices, project file location) are relayed there by main.
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Theme } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';

import useUserSettingsRoot from './hooks/useUserSettingsRoot';
import useDirectoryAccess from './hooks/useDirectoryAccess';
import type { AppContextType, UserSettingsContextType } from './contexts';
import { AppContext, UserSettingsContext } from './contexts';
import GenericDialog, { useDialog } from './components/GenericDialog';
import ErrorDialog from './components/ErrorDialog';
import useErrorHandling from './hooks/useErrorHandling';
import Settings from './components/Settings';
import SwalContainer from './components/SwalContainer';
import { askForOutDir } from './dialogs';
import type { CaptureFormat } from '../../common/types.js';
import type { TunerType } from './types';

const { ipcRenderer } = window.require('electron');

const relay = (action: string, arg?: unknown) => ipcRenderer.send('settingsAction', action, arg);

export default function SettingsWindow() {
  const { t } = useTranslation();
  const allUserSettings = useUserSettingsRoot();
  const { settings, darkMode, prefersReducedMotion, customOutDir, setCustomOutDir, setCaptureFormat, setKeyframeCut, setExportConfirmEnabled, setSimpleMode, setSafeOutputFileName } = allUserSettings;
  const { simpleMode, autoMerge, autoDeleteMergedSegments, segmentsToChaptersOnly, reducedMotion } = settings;
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(!simpleMode);

  const { ensureWritableOutDir } = useDirectoryAccess({ setCustomOutDir });
  const { showGenericDialog, genericDialog, closeGenericDialog, confirmDialog } = useDialog();
  const { handleError, genericError, setGenericError } = useErrorHandling();
  const appContext = useMemo<AppContextType>(() => ({
    working: undefined,
    setWorking: () => undefined,
    handleError,
    showGenericDialog,
    confirmDialog,
    keyboardLayoutMap: undefined,
    updateKeyboardLayout: async () => undefined,
  }), [confirmDialog, handleError, showGenericDialog]);

  const changeOutDir = useCallback(async () => {
    const newOutDir = await askForOutDir(customOutDir);
    if (newOutDir) setCustomOutDir(newOutDir);
  }, [customOutDir, setCustomOutDir]);

  const userSettingsContext = useMemo<UserSettingsContextType>(() => {
    function getExportMode() {
      if (segmentsToChaptersOnly) return 'segments_to_chapters';
      if (autoMerge && autoDeleteMergedSegments) return 'merge';
      if (autoMerge) return 'merge+separate';
      return 'separate';
    }
    const { settings: s, ...rest } = allUserSettings;
    return {
      ...s,
      ...rest,
      toggleCaptureFormat: () => setCaptureFormat((f) => {
        const formats: CaptureFormat[] = ['jpeg', 'png', 'webp'];
        return formats[(formats.indexOf(f) + 1) % formats.length]!;
      }),
      changeOutDir,
      toggleKeyframeCut: () => setKeyframeCut((v) => !v),
      toggleExportConfirmEnabled: () => setExportConfirmEnabled((v) => !v),
      toggleSimpleMode: () => setSimpleMode((v) => !v),
      toggleSafeOutputFileName: () => setSafeOutputFileName((v) => !v),
      effectiveExportMode: getExportMode(),
      ensureWritableOutDirWithFilePath: async ({ outDir }) => ensureWritableOutDir({ inputPath: undefined, outDir }),
    };
  }, [allUserSettings, autoDeleteMergedSegments, autoMerge, changeOutDir, ensureWritableOutDir, segmentsToChaptersOnly, setCaptureFormat, setExportConfirmEnabled, setKeyframeCut, setSafeOutputFileName, setSimpleMode]);

  const onTunerRequested = useCallback((type: TunerType) => relay('tuner', type), []);
  const onKeyboardShortcutsDialogRequested = useCallback(() => relay('keyboardShortcuts'), []);
  const askForCleanupChoices = useCallback(async () => relay('cleanupChoices'), []);
  const toggleStoreProjectInWorkingDir = useCallback(async () => relay('toggleStoreProjectInWorkingDir'), []);

  useEffect(() => {
    document.title = t('Settings');
  }, [t]);

  useEffect(() => {
    // a settings window uses the smaller text of macOS settings panes
    document.documentElement.style.fontSize = '13px';
    // main shows the window once this first frame is painted
    requestAnimationFrame(() => requestAnimationFrame(() => ipcRenderer.send('window-painted')));
  }, []);

  const baseColorStyle = useMemo<CSSProperties>(() => ({ color: 'var(--gray-12)', background: 'var(--cut-panel)', colorScheme: darkMode ? 'only dark' : 'only light' }), [darkMode]);
  const rootClass = [...(darkMode ? ['dark-theme'] : []), ...(prefersReducedMotion ? ['no-animations'] : [])].join(' ');

  return (
    <Theme appearance={darkMode ? 'dark' : 'light'} accentColor="blue">
      <MotionConfig reducedMotion={reducedMotion}>
        <AppContext value={appContext}>
        <UserSettingsContext value={userSettingsContext}>
          <div className={rootClass} style={{ ...baseColorStyle, height: '100vh', overflowY: 'auto', boxSizing: 'border-box', padding: '.4em 1.6em 1.6em' }}>
            <Settings
              onTunerRequested={onTunerRequested}
              onKeyboardShortcutsDialogRequested={onKeyboardShortcutsDialogRequested}
              askForCleanupChoices={askForCleanupChoices}
              toggleStoreProjectInWorkingDir={toggleStoreProjectInWorkingDir}
              showAdvancedSettings={showAdvancedSettings}
              setShowAdvancedSettings={setShowAdvancedSettings}
            />
          </div>
          <GenericDialog dialog={genericDialog} onOpenChange={(open) => !open && closeGenericDialog()} />
          <ErrorDialog error={genericError} onOpenChange={(open) => !open && setGenericError(undefined)} />
          <SwalContainer darkMode={darkMode} style={baseColorStyle} />
        </UserSettingsContext>
        </AppContext>
      </MotionConfig>
    </Theme>
  );
}
