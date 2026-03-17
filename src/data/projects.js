// Unified data source - import from portfolioData
// This file maintains backward compatibility while pointing to the new data structure
import { portfolioData } from './portfolioData';

// Legacy format export for backward compatibility
// The data is now served from the MongoDB-compatible structure in portfolioData.js
const projects = portfolioData.projects;

export default projects;
