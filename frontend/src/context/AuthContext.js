// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // For decoding JWT tokens

const AuthContext = createContext(null);
const API_BASE_URL = 'http://localhost:8000/api/auth'; // Your Django API URL

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') ? JSON.parse(localStorage.getItem('authToken')) : null);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const updateAuthTokens = useCallback(async () => {
        setLoading(true);
        const storedAuthToken = localStorage.getItem('authToken');
        if (!storedAuthToken) {
            setIsAuthenticated(false);
            setUser(null);
            setAuthToken(null);
            setLoading(false);
            return;
        }

        const currentAuthToken = JSON.parse(storedAuthToken);

        if (currentAuthToken.access && currentAuthToken.refresh) {
            const userPayload = jwtDecode(currentAuthToken.access);
            const refreshPayload = jwtDecode(currentAuthToken.refresh);

            // Check if refresh token is expired
            if (refreshPayload.exp * 1000 < Date.now()) {
                console.log("Refresh token expired. Logging out.");
                logout();
                return;
            }

            // Check if access token is expired (or about to expire)
            if (userPayload.exp * 1000 < Date.now() - (60 * 1000)) { // Expired or expiring in last minute
                try {
                    console.log("Access token expired, attempting to refresh...");
                    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                        refresh: currentAuthToken.refresh
                    });
                    const newAuthToken = { ...currentAuthToken, access: response.data.access };
                    localStorage.setItem('authToken', JSON.stringify(newAuthToken));
                    setAuthToken(newAuthToken);
                    setUser(jwtDecode(newAuthToken.access));
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Failed to refresh token:", error);
                    logout();
                }
            } else {
                // Access token is still valid
                setAuthToken(currentAuthToken);
                setUser(userPayload);
                setIsAuthenticated(true);
            }
        } else {
            logout(); // Invalid token structure
        }
        setLoading(false);
    }, []); // No dependencies, runs once

    useEffect(() => {
        updateAuthTokens();
        // Set up an interval to refresh token periodically if needed (e.g., every 4 minutes)
        const fourMinutes = 1000 * 60 * 4;
        const interval = setInterval(() => {
            if (isAuthenticated) { // Only try to refresh if already authenticated
                updateAuthTokens();
            }
        }, fourMinutes);
        return () => clearInterval(interval);
    }, [isAuthenticated, updateAuthTokens]); // Rerun when isAuthenticated changes or updateAuthTokens changes

    const login = async (username, password) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/token/`, { username, password });
            const newAuthToken = response.data;
            localStorage.setItem('authToken', JSON.stringify(newAuthToken));
            setAuthToken(newAuthToken);
            setUser(jwtDecode(newAuthToken.access));
            setIsAuthenticated(true);
            setLoading(false);
            return true;
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
            setLoading(false);
            throw error;
        }
    };

    const register = async (username, email, password) => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/register/`, { username, email, password });
            setLoading(false);
            return true;
        } catch (error) {
            console.error('Registration failed:', error.response?.data || error.message);
            setLoading(false);
            throw error;
        }
    };

    const logout = useCallback(() => {
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('authToken');
        setLoading(false);
    }, []);

    const authAxios = axios.create({
        baseURL: 'http://localhost:8000/api/', // Your Django API base URL
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Intercept requests to add Authorization header
    authAxios.interceptors.request.use(
        (config) => {
            if (authToken) {
                config.headers.Authorization = `Bearer ${authToken.access}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Intercept responses to handle token refresh if 401 Unauthorized
    authAxios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const res = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                        refresh: authToken?.refresh,
                    });
                    const newAuthToken = { ...authToken, access: res.data.access };
                    localStorage.setItem('authToken', JSON.stringify(newAuthToken));
                    setAuthToken(newAuthToken);
                    originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                    return authAxios(originalRequest); // Retry the original request
                } catch (refreshError) {
                    console.error("Token refresh failed. Logging out.", refreshError);
                    logout();
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );

    // Make sure 'jwt-decode' is installed: npm install jwt-decode
    // For older versions of jwt-decode, you might need: import jwt_decode from 'jwt-decode';

    return (
        <AuthContext.Provider value={{
            authToken, user, isAuthenticated, loading,
            login, register, logout, authAxios, updateAuthTokens
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);