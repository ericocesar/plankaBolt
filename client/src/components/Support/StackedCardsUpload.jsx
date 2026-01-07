import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Icon, Button } from 'semantic-ui-react';

// Simplified Stacked Cards Upload component inspired by Ruixen UI
// Since we don't have the full library, we implement a custom version using semantic-ui-react + inline styles
// to match the "stacked" aesthetic.

function StackedCardsUpload({ files, onFilesChange }) {
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesChange([...files, ...Array.from(e.dataTransfer.files)]);
        e.dataTransfer.clearData();
      }
    },
    [files, onFilesChange],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesChange([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleRemove = (indexToRemove) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    onFilesChange(newFiles);
  };

  const handleClick = () => {
    document.getElementById('hidden-file-input').click();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        style={{
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: '#f9fafb',
          transition: 'all 0.2s',
          marginBottom: files.length > 0 ? '1rem' : 0,
        }}
      >
        <input
          id="hidden-file-input"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <div
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#eff6ff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <Icon name="cloud upload" size="large" color="blue" />
        </div>
        <p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>
          Clique ou arraste arquivos para fazer upload
        </p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#9ca3af' }}>
          (Máx 10MB por arquivo)
        </p>
      </div>

      {/* Stacked Cards List */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${file.size}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                position: 'relative',
                // Stack effect logic could go here if we wanted overlap,
                // but a clean list is often better for usability in forms.
                // We'll stick to a clean list with "card" styling.
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                }}
              >
                <Icon name="file outline" color="grey" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 500,
                    color: '#374151',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {file.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                icon
                basic
                compact
                onClick={() => handleRemove(index)}
                style={{ boxShadow: 'none', marginLeft: '0.5rem' }}
              >
                <Icon name="trash alternate outline" color="red" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

StackedCardsUpload.propTypes = {
  files: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  onFilesChange: PropTypes.func.isRequired,
};

export default StackedCardsUpload;
