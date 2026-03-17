/**
 * MongoDB API Integration Utilities
 * Handles all API calls to backend MongoDB database
 */

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000';

/**
 * Fetch portfolio data from MongoDB
 * Falls back to local data if API is unavailable
 */
export const fetchPortfolioData = async (fallbackData = null) => {
  try {
    const response = await fetch(`${API_BASE}/api/portfolio`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch from MongoDB API, using local fallback:', error);
    return fallbackData;
  }
};

/**
 * Fetch projects from MongoDB
 */
export const fetchProjects = async (category = null, fallbackData = null) => {
  try {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await fetch(`${API_BASE}/api/projects${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch projects from MongoDB:', error);
    return fallbackData || [];
  }
};

/**
 * Fetch single project by ID
 */
export const fetchProject = async (projectId, fallbackData = null) => {
  try {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch project ${projectId}:`, error);
    return fallbackData;
  }
};

/**
 * Fetch skills from MongoDB
 */
export const fetchSkills = async (category = null, fallbackData = null) => {
  try {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await fetch(`${API_BASE}/api/skills${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch skills from MongoDB:', error);
    return fallbackData || [];
  }
};

/**
 * Create or update a project in MongoDB (Admin only)
 */
export const saveProject = async (projectData, token) => {
  try {
    const method = projectData._id ? 'PUT' : 'POST';
    const url = projectData._id 
      ? `${API_BASE}/api/projects/${projectData._id}` 
      : `${API_BASE}/api/projects`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save project:', error);
    throw error;
  }
};

/**
 * Delete a project from MongoDB (Admin only)
 */
export const deleteProject = async (projectId, token) => {
  try {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
};

/**
 * Batch operations - update multiple projects
 */
export const batchUpdateProjects = async (projects, token) => {
  try {
    const response = await fetch(`${API_BASE}/api/projects/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ projects }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to batch update projects:', error);
    throw error;
  }
};

/**
 * Fetch analytics/metrics from MongoDB
 */
export const fetchAnalytics = async (fallbackData = null) => {
  try {
    const response = await fetch(`${API_BASE}/api/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch analytics:', error);
    return fallbackData;
  }
};

/**
 * Check API health
 */
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
};

export default {
  fetchPortfolioData,
  fetchProjects,
  fetchProject,
  fetchSkills,
  saveProject,
  deleteProject,
  batchUpdateProjects,
  fetchAnalytics,
  checkAPIHealth,
};
