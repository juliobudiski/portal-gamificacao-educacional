// frontend/src/components/GlobalErrorBoundary.jsx
import React from 'react';
import PropTypes from 'prop-types';
import NotFoundPage from '../pages/NotFoundPage';

/**
 * GlobalErrorBoundary
 * 
 * Architectural intent: Captures unhandled JavaScript errors in the React component tree,
 * logs the crash info for observability, and renders a unified fallback UI (NotFoundPage in crash mode)
 * preventing white-screen catastrophic failures.
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GlobalErrorBoundary] Erro crítico capturado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <NotFoundPage 
          isCrash={true} 
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

GlobalErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GlobalErrorBoundary;
