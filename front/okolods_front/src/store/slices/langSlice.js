import { createSlice } from '@reduxjs/toolkit'

export const langSlice = createSlice({
  name: 'lang',
  initialState: {
    value: "en",
  },
  reducers: {
    set: (state, action) => {
      state.value = action.payload;
    }
  },
})

export const { set } = langSlice.actions;

export let langReducer = langSlice.reducer;