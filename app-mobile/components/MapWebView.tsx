import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapWebViewProps {
  address: string;
}

const MapWebView: React.FC<MapWebViewProps> = ({ address }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const encodedAddress = encodeURIComponent(address);

  // Create HTML content with iframe to properly embed Google Maps
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <style>
        body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        .map-container {
          width: 100%;
          height: 100%;
        }
        iframe {
          width: 100%;
          height: 100%;
          min-height: 400px; /* Double the height for better visibility */
          border: none;
        }
      </style>
    </head>
    <body>
      <div class="map-container">
        <iframe
          src="https://www.google.com/maps?q=${encodedAddress}&z=15&output=embed"
          width="100%"
          height="100%"
          frameborder="0"
          style="border:0"
          allowfullscreen
        ></iframe>
      </div>
    </body>
    </html>
  `;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={styles.container}>
      {loading && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text>Đang tải bản đồ...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể tải bản đồ</Text>
        </View>
      )}
      <WebView
        source={{ html: htmlContent }}
        style={[styles.webview, loading && !error && styles.hidden, error && styles.hidden]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoad={handleLoad}
        onError={handleError}
        startInLoadingState={true}
        scalesPageToFit={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
  webview: {
    width: '100%',
    flex: 1,
  },
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4d4f',
    textAlign: 'center',
  },
});

export default MapWebView;