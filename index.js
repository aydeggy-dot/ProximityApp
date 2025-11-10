/**
 * @format
 */

console.log('[INDEX.JS] Starting app registration...');

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('[INDEX.JS] Registering component:', appName);
AppRegistry.registerComponent(appName, () => App);

console.log('[INDEX.JS] Component registered successfully');
