// src/context/AppContext.js
import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [studentDetails, setStudentDetails] = useState({});
  const [selectedMentor, setSelectedMentor] = useState('');

  return (
    <AppContext.Provider value={{ studentDetails, setStudentDetails, selectedMentor, setSelectedMentor }}>
      {children}
    </AppContext.Provider>
  );
};

