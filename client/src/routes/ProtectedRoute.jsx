import React from 'react';
import { useStore } from '../hooks/useStore';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const { dataUser } = useStore();

    if (!dataUser._id) {
        // If user is not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // If user is logged in, render the children components
    return children;
}

export default ProtectedRoute;