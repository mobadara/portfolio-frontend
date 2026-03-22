const sampleProjects = [
    {
      _id: "proj_001",
      title: "Sentiment Analysis with BERT",
      category: "Deep Learning",
      description: "Fine-tuning transformer models to classify sentiment in financial news with 94% accuracy.",
      fullDescription: "This project demonstrates advanced NLP techniques using state-of-the-art transformer models. Achieved 94% accuracy on financial sentiment classification, enabling better market analysis.",
      technologies: ["PyTorch", "Hugging Face", "NLP", "Transformers"],
      image: "https://placehold.co/600x400/001f3f/FFF?text=NLP+Model",
      links: {
        github: "https://github.com/mobadara/sentiment-analysis",
        demo: "https://sentiment-demo.example.com",
        paper: null,
        youtube: "https://youtube.com/watch?v=sentiment-analysis-demo"
      },
      metrics: {
        accuracy: 94,
        datasets: 50000,
        models_trained: 3
      },
      order: 1,
      featured: true
    },
    {
      _id: "proj_002",
      title: "Credit Risk Prediction",
      category: "Data Science",
      description: "Classical ML pipeline using Random Forest and XGBoost to predict loan defaults for a fintech client.",
      fullDescription: "Enterprise-grade machine learning solution for financial risk assessment. Implemented comprehensive feature engineering, model selection, and cross-validation strategies.",
      technologies: ["Scikit-Learn", "Pandas", "XGBoost", "SQL"],
      image: "https://placehold.co/600x400/e0e0e0/333?text=Risk+Model",
      links: {
        github: "https://github.com/mobadara/credit-risk",
        demo: null,
        paper: null
      },
      metrics: {
        precision: 0.91,
        recall: 0.88,
        auc_score: 0.94
      },
      order: 2,
      featured: false
    },
    {
      _id: "proj_003",
      title: "AI-Powered REST API",
      category: "AI Engineering",
      description: "Scalable REST API built with FastAPI to serve real-time predictions from trained PyTorch models.",
      fullDescription: "Production-ready API serving ML models at scale. Includes authentication, rate limiting, comprehensive logging, and containerization for cloud deployment.",
      technologies: ["FastAPI", "Docker", "Azure", "PostgreSQL"],
      image: "https://placehold.co/600x400/003366/FFF?text=FastAPI+Backend",
      links: {
        github: "https://github.com/mobadara/ml-api",
        demo: "https://api.example.com/docs",
        paper: null,
          youtube: "https://youtube.com/watch?v=ml-api-tutorial"
      },
      metrics: {
        requests_per_second: 1000,
        uptime: 99.9,
        response_time_ms: 150
      },
      order: 3,
      featured: true
    },
    {
      _id: "proj_004",
      title: "Computer Vision for Medical Imaging",
      category: "Deep Learning",
      description: "CNN-based system trained on X-ray datasets to detect pneumonia with clinical-grade accuracy.",
      fullDescription: "Deep learning system achieving 96% sensitivity in pneumonia detection. Deployed in healthcare settings with HIPAA compliance and interpretability features.",
      technologies: ["TensorFlow", "CNN", "OpenCV", "Grad-CAM"],
      image: "https://placehold.co/600x400/555/FFF?text=Computer+Vision",
      links: {
        github: "https://github.com/mobadara/medical-imaging",
        demo: null,
        paper: "https://arxiv.example.com/pneumonia",
          youtube: "https://youtube.com/watch?v=medical-imaging-demo"
      },
      metrics: {
        sensitivity: 0.96,
        specificity: 0.94,
        auc: 0.98
      },
      order: 4,
      featured: true
    },
    {
      _id: "proj_005",
      title: "Customer Churn Prediction",
      category: "Data Science",
      description: "End-to-end ML pipeline identifying at-risk customers with actionable insights.",
      fullDescription: "Comprehensive churn analysis reducing customer loss by 28%. Includes feature importance analysis, customer segmentation, and retention strategies.",
      technologies: ["Python", "pandas", "scikit-learn", "Plotly"],
      image: "https://placehold.co/600x400/001f3f/FFF?text=Data+Analysis",
      links: {
        github: "https://github.com/mobadara/churn-prediction",
        demo: "https://churn-dashboard.example.com",
        paper: null
      },
      metrics: {
        churn_reduction: 0.28,
        model_accuracy: 0.89,
        features_used: 45
      },
      order: 5,
      featured: false
    },
    {
      _id: "proj_006",
      title: "Analytics Dashboard",
      category: "Visualization",
      description: "Interactive Power BI dashboard for healthcare resource optimization.",
      fullDescription: "Enterprise analytics solution visualizing patient demographics, resource allocation, and operational metrics in real-time.",
      technologies: ["Power BI", "SQL", "DAX", "Excel"],
      image: "https://placehold.co/600x400/FFD700/000?text=PowerBI",
      links: {
        github: null,
        demo: "https://app.powerbi.com/example",
        paper: null
      },
      metrics: {
        dashboards: 12,
        automated_reports: 8,
        users: 250
      },
      order: 6,
      featured: false
    }
  ];
  

  export default sampleProjects;