import React, {
  useReducer,
  useRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import styled, { keyframes } from 'styled-components';
import useMouse from 'react-use/lib/useMouse';
import ga from 'react-ga';

import {
  ADD_APP,
  DEL_APP,
  FOCUS_APP,
  MINIMIZE_APP,
  TOGGLE_MAXIMIZE_APP,
  FOCUS_ICON,
  SELECT_ICONS,
  FOCUS_DESKTOP,
  START_SELECT,
  END_SELECT,
  POWER_OFF,
  CANCEL_POWER_OFF,
} from './constants/actions';
import { FOCUSING, POWER_STATE } from './constants';
import { defaultIconState, defaultAppState, appSettings } from './apps';
import Modal from './Modal';
import Footer from './Footer';
import Windows from './Windows';
import Icons from './Icons';
import { DashedBox } from 'components';

const DESKTOP_SCALE = 1.25;

const initState = {
  apps: defaultAppState,
  nextAppID: defaultAppState.length,
  nextZIndex: defaultAppState.length,
  focusing: FOCUSING.WINDOW,
  icons: defaultIconState,
  selecting: false,
  powerState: POWER_STATE.START,
};
const reducer = (state, action = { type: '' }) => {
  ga.event({
    category: 'XP interaction',
    action: action.type,
  });
  switch (action.type) {
    case ADD_APP:
      const app = state.apps.find(
        _app => _app.component === action.payload.component,
      );
      if (action.payload.multiInstance || !app) {
        return {
          ...state,
          apps: [
            ...state.apps,
            {
              ...action.payload,
              id: state.nextAppID,
              zIndex: state.nextZIndex,
            },
          ],
          nextAppID: state.nextAppID + 1,
          nextZIndex: state.nextZIndex + 1,
          focusing: FOCUSING.WINDOW,
        };
      }
      const apps = state.apps.map(app =>
        app.component === action.payload.component
          ? { ...app, zIndex: state.nextZIndex, minimized: false }
          : app,
      );
      return {
        ...state,
        apps,
        nextZIndex: state.nextZIndex + 1,
        focusing: FOCUSING.WINDOW,
      };
    case DEL_APP:
      if (state.focusing !== FOCUSING.WINDOW) return state;
      return {
        ...state,
        apps: state.apps.filter(app => app.id !== action.payload),
        focusing:
          state.apps.length > 1
            ? FOCUSING.WINDOW
            : state.icons.find(icon => icon.isFocus)
            ? FOCUSING.ICON
            : FOCUSING.DESKTOP,
      };
    case FOCUS_APP: {
      const apps = state.apps.map(app =>
        app.id === action.payload
          ? { ...app, zIndex: state.nextZIndex, minimized: false }
          : app,
      );
      return {
        ...state,
        apps,
        nextZIndex: state.nextZIndex + 1,
        focusing: FOCUSING.WINDOW,
      };
    }
    case MINIMIZE_APP: {
      if (state.focusing !== FOCUSING.WINDOW) return state;
      const apps = state.apps.map(app =>
        app.id === action.payload ? { ...app, minimized: true } : app,
      );
      return {
        ...state,
        apps,
        focusing: FOCUSING.WINDOW,
      };
    }
    case TOGGLE_MAXIMIZE_APP: {
      if (state.focusing !== FOCUSING.WINDOW) return state;
      const apps = state.apps.map(app =>
        app.id === action.payload ? { ...app, maximized: !app.maximized } : app,
      );
      return {
        ...state,
        apps,
        focusing: FOCUSING.WINDOW,
      };
    }
    case FOCUS_ICON: {
      const icons = state.icons.map(icon => ({
        ...icon,
        isFocus: icon.id === action.payload,
      }));
      return {
        ...state,
        focusing: FOCUSING.ICON,
        icons,
      };
    }
    case SELECT_ICONS: {
      const icons = state.icons.map(icon => ({
        ...icon,
        isFocus: action.payload.includes(icon.id),
      }));
      return {
        ...state,
        icons,
        focusing: FOCUSING.ICON,
      };
    }
    case FOCUS_DESKTOP:
      return {
        ...state,
        focusing: FOCUSING.DESKTOP,
        icons: state.icons.map(icon => ({
          ...icon,
          isFocus: false,
        })),
      };
    case START_SELECT:
      return {
        ...state,
        focusing: FOCUSING.DESKTOP,
        icons: state.icons.map(icon => ({
          ...icon,
          isFocus: false,
        })),
        selecting: action.payload,
      };
    case END_SELECT:
      return {
        ...state,
        selecting: null,
      };
    case POWER_OFF:
      return {
        ...state,
        powerState: action.payload,
      };
    case CANCEL_POWER_OFF:
      return {
        ...state,
        powerState: POWER_STATE.START,
      };
    default:
      return state;
  }
};
function WinXP() {
  const [state, dispatch] = useReducer(reducer, initState);
  const ref = useRef(null);
  const mouse = useMouse(ref);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    if (window.__LEGACY_CURSOR_LOADED__) return;
    window.__CURSOR_NORMAL_URL = `${process.env.PUBLIC_URL}/assets/cursor.gif`;
    window.__CURSOR_REVERSED_URL = `${process.env.PUBLIC_URL}/assets/cursor-reversed.gif`;
    const script = document.createElement('script');
    script.src = `${process.env.PUBLIC_URL}/cursor.js`;
    script.async = true;
    script.onload = () => {
      window.__LEGACY_CURSOR_LOADED__ = true;
    };
    document.body.appendChild(script);
  }, []);

  const focusedAppId = getFocusedAppId();
  const onFocusApp = useCallback(id => {
    dispatch({ type: FOCUS_APP, payload: id });
  }, []);
  const onMaximizeWindow = useCallback(
    id => {
      if (focusedAppId === id) {
        dispatch({ type: TOGGLE_MAXIMIZE_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  const onMinimizeWindow = useCallback(
    id => {
      if (focusedAppId === id) {
        dispatch({ type: MINIMIZE_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  const onCloseApp = useCallback(
    id => {
      if (focusedAppId === id) {
        dispatch({ type: DEL_APP, payload: id });
      }
    },
    [focusedAppId],
  );
  function onMouseDownFooterApp(id) {
    if (focusedAppId === id) {
      dispatch({ type: MINIMIZE_APP, payload: id });
    } else {
      dispatch({ type: FOCUS_APP, payload: id });
    }
  }
  function onMouseDownIcon(id) {
    dispatch({ type: FOCUS_ICON, payload: id });
  }
  function onDoubleClickIcon(component) {
    const appSetting = Object.values(appSettings).find(
      setting => setting.component === component,
    );
    dispatch({ type: ADD_APP, payload: appSetting });
  }
  function getFocusedAppId() {
    if (state.focusing !== FOCUSING.WINDOW) return -1;
    const focusedApp = [...state.apps]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(app => !app.minimized);
    return focusedApp ? focusedApp.id : -1;
  }
  function onMouseDownFooter() {
    dispatch({ type: FOCUS_DESKTOP });
  }
  function onClickMenuItem(o) {
    if (o === 'Internet' || o === 'Internet Explorer' || o === 'The Chrome Explorer')
      dispatch({ type: ADD_APP, payload: appSettings['The Chrome Explorer'] });
    else if (o === 'Minesweeper')
      dispatch({ type: ADD_APP, payload: appSettings.Minesweeper });
    else if (o === 'Abstract Computer')
      dispatch({ type: ADD_APP, payload: appSettings['Abstract Computer'] });
    else if (o === 'Notepad')
      dispatch({ type: ADD_APP, payload: appSettings.Notepad });
    else if (o === 'Winamp')
      dispatch({ type: ADD_APP, payload: appSettings.Winamp });
    else if (o === 'Paint')
      dispatch({ type: ADD_APP, payload: appSettings.Paint });
    else if (o === 'Log Off')
      dispatch({ type: POWER_OFF, payload: POWER_STATE.LOG_OFF });
    else if (o === 'Turn Off Computer')
      dispatch({ type: POWER_OFF, payload: POWER_STATE.TURN_OFF });
    else
      dispatch({
        type: ADD_APP,
        payload: {
          ...appSettings.Error,
          injectProps: { message: 'C:\\\nApplication not found' },
        },
      });
  }
  function onMouseDownDesktop(e) {
    if (contextMenu.visible) {
      setContextMenu(menu => ({ ...menu, visible: false }));
    }
    if (e.target === e.currentTarget)
      dispatch({
        type: START_SELECT,
        payload: { x: mouse.docX, y: mouse.docY },
      });
  }
  function onMouseUpDesktop(e) {
    dispatch({ type: END_SELECT });
  }
  function onIconsSelected(iconIds) {
    dispatch({ type: SELECT_ICONS, payload: iconIds });
  }
  function onClickModalButton(text) {
    dispatch({ type: CANCEL_POWER_OFF });
    dispatch({
      type: ADD_APP,
      payload: appSettings.Error,
    });
  }
  function onModalClose() {
    dispatch({ type: CANCEL_POWER_OFF });
  }

  function onContextMenuDesktop(e) {
    e.preventDefault();
    dispatch({ type: END_SELECT });
    setContextMenu({
      visible: true,
      x: e.clientX / DESKTOP_SCALE,
      y: e.clientY / DESKTOP_SCALE,
    });
  }

  function onClickContextMenuItem(action) {
    if (action === 'refresh') {
      dispatch({ type: FOCUS_DESKTOP });
    } else if (action === 'open-ie') {
      dispatch({ type: ADD_APP, payload: appSettings['The Chrome Explorer'] });
    }
    setContextMenu(menu => ({ ...menu, visible: false }));
  }

  return (
    <Container
      ref={ref}
      onMouseUp={onMouseUpDesktop}
      onMouseDown={onMouseDownDesktop}
      onContextMenu={onContextMenuDesktop}
      state={state.powerState}
    >
      <BackgroundVideo autoPlay loop muted playsInline>
        <source src={`${process.env.PUBLIC_URL}/assets/bg0.mp4`} type="video/mp4" />
      </BackgroundVideo>
      <DesktopLayer>
        {contextMenu.visible && (
          <DesktopContextMenu
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseDown={e => e.stopPropagation()}
          >
            <DesktopContextMenuItem onMouseDown={() => onClickContextMenuItem('refresh')}>
              Refresh
            </DesktopContextMenuItem>
            <DesktopContextMenuItem onMouseDown={() => onClickContextMenuItem('open-ie')}>
              Open Internet Explorer
            </DesktopContextMenuItem>
          </DesktopContextMenu>
        )}
        <Icons
          icons={state.icons}
          onMouseDown={onMouseDownIcon}
          onDoubleClick={onDoubleClickIcon}
          displayFocus={state.focusing === FOCUSING.ICON}
          appSettings={appSettings}
          mouse={mouse}
          selecting={state.selecting}
          setSelectedIcons={onIconsSelected}
        />
        <DashedBox startPos={state.selecting} mouse={mouse} />
        <Windows
          apps={state.apps}
          onMouseDown={onFocusApp}
          onClose={onCloseApp}
          onMinimize={onMinimizeWindow}
          onMaximize={onMaximizeWindow}
          focusedAppId={focusedAppId}
          desktopScale={DESKTOP_SCALE}
        />
        <Footer
          apps={state.apps}
          onMouseDownApp={onMouseDownFooterApp}
          focusedAppId={focusedAppId}
          onMouseDown={onMouseDownFooter}
          onClickMenuItem={onClickMenuItem}
        />
        {state.powerState !== POWER_STATE.START && (
          <Modal
            onClose={onModalClose}
            onClickButton={onClickModalButton}
            mode={state.powerState}
          />
        )}
      </DesktopLayer>
    </Container>
  );
}

const powerOffAnimation = keyframes`
  0% {
    filter: brightness(1) grayscale(0);
  }
  30% {
    filter: brightness(1) grayscale(0);
  }
  100% {
    filter: brightness(0.6) grayscale(1);
  }
`;
const animation = {
  [POWER_STATE.START]: '',
  [POWER_STATE.TURN_OFF]: powerOffAnimation,
  [POWER_STATE.LOG_OFF]: powerOffAnimation,
};

const Container = styled.div`
  font-family: Tahoma, Verdana, 'Segoe UI', sans-serif;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #000;
  cursor: none;
  transform: scale(${DESKTOP_SCALE});
  transform-origin: top left;
  width: calc(100% / ${DESKTOP_SCALE});
  height: calc(100% / ${DESKTOP_SCALE});
  animation: ${({ state }) => animation[state]} 5s forwards;
  *:not(input):not(textarea) {
    user-select: none;
  }
`;

const DesktopLayer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const BackgroundVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
`;

const DesktopContextMenu = styled.div`
  position: fixed;
  min-width: 180px;
  border: 1px solid #7f7f7f;
  background: #f0f0f0;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.35);
  z-index: 20001;
  padding: 2px;
`;

const DesktopContextMenuItem = styled.div`
  padding: 6px 10px;
  font-size: 12px;
  color: #111;
  &:hover {
    background: #0a64d6;
    color: #fff;
  }
`;

export default WinXP;
