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

// Action creators are generated for each case reducer function
export const { set } = langSlice.actions;

export let langReducer = langSlice.reducer;