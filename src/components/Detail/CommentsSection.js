import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Save, Clock, User, Loader } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const CommentsSection = ({ opportunity, className = '' }) => {
  const { updateComments } = useData();
  const { user } = useAuth();
  const [localComments, setLocalComments] = useState(opportunity.comments || '');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'editing', 'saving', 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const initialLoadRef = useRef(true);

  // Update local state when opportunity changes (from external updates)
  useEffect(() => {
    if (!initialLoadRef.current) {
      setLocalComments(opportunity.comments || '');
    }
    initialLoadRef.current = false;
  }, [opportunity.comments]);

  // Auto-save debounced function
  const debouncedSave = useCallback(
    (comments) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set saving status
      setSaveStatus('editing');

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(async () => {
        if (comments !== (opportunity.comments || '')) {
          setSaveStatus('saving');
          try {
            await updateComments(opportunity.id, comments);
            setSaveStatus('saved');
            setLastSaved(new Date());
          } catch (error) {
            console.error('Error saving comments:', error);
            setSaveStatus('error');
            // Retry after 3 seconds
            setTimeout(() => {
              debouncedSave(comments);
            }, 3000);
          }
        } else {
          setSaveStatus('saved');
        }
      }, 2000); // 2 second delay
    },
    [opportunity.id, opportunity.comments, updateComments]
  );

  // Handle text change
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    setLocalComments(newValue);
    debouncedSave(newValue);
  };

  // Manual save function (for immediate save)
  const handleManualSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus('saving');
    try {
      await updateComments(opportunity.id, localComments);
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving comments:', error);
      setSaveStatus('error');
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(100, textarea.scrollHeight) + 'px';
    }
  }, [localComments]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'editing':
        return <Clock size={14} className="text-warning" />;
      case 'saving':
        return <Loader size={14} className="text-primary spinner-border spinner-border-sm" />;
      case 'saved':
        return <Save size={14} className="text-success" />;
      case 'error':
        return <Clock size={14} className="text-danger" />;
      default:
        return <Save size={14} className="text-muted" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'editing':
        return 'Typing...';
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Saved';
      case 'error':
        return 'Save failed (retrying...)';
      default:
        return '';
    }
  };

  const getLastUpdatedInfo = () => {
    if (opportunity.comments_last_updated && opportunity.comments_last_updated_by) {
      const date = new Date(opportunity.comments_last_updated);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        user: opportunity.comments_last_updated_by
      };
    }
    return null;
  };

  const lastUpdated = getLastUpdatedInfo();

  return (
    <div className={`bg-white border rounded p-4 ${className}`}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center">
          <MessageSquare size={18} className="text-primary me-2" />
          <h6 className="mb-0 fw-semibold">Comments & Notes</h6>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          {/* Save Status */}
          <div className="d-flex align-items-center text-muted small">
            {getSaveStatusIcon()}
            <span className="ms-1">{getSaveStatusText()}</span>
          </div>
          
          {/* Manual Save Button (for immediate save) */}
          {saveStatus === 'editing' && (
            <button
              onClick={handleManualSave}
              className="btn btn-sm btn-outline-primary"
              title="Save now"
            >
              <Save size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="mb-3">
        <textarea
          ref={textareaRef}
          value={localComments}
          onChange={handleTextChange}
          placeholder="Add comments, notes, or context about this opportunity..."
          className="form-control border-0 bg-light"
          style={{ 
            minHeight: '100px',
            outline: 'none',
            boxShadow: 'none',
            resize: 'none'
          }}
          disabled={!user}
        />
      </div>

      {/* Footer Info */}
      <div className="d-flex align-items-center justify-content-between text-muted small">
        <div>
          {localComments.length > 0 && (
            <span>{localComments.length} characters</span>
          )}
        </div>
        
        {lastUpdated && (
          <div className="d-flex align-items-center">
            <User size={12} className="me-1" />
            <span>
              Last updated by <strong>{lastUpdated.user}</strong> on {lastUpdated.date} at {lastUpdated.time}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {saveStatus === 'error' && (
        <div className="alert alert-danger mt-2 mb-0" style={{padding: '0.5rem'}}>
          <small>Failed to save comments. Retrying automatically...</small>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;