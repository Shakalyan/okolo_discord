import { configureStore } from '@reduxjs/toolkit'
import { langReducer } from './slices/langSlice.js';

export default configureStore({
  reducer: {
    lang: langReducer
  },
});