import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import './style.css';

const div = document.createElement( 'div' );
const root = createRoot( div );
root.render( <App /> );
document.body.appendChild( div );
