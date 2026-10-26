# System Architecture

+## System architecture

Target flow: users → React static SPA → authenticated Workers API → D1/R2/DO/Queue → media processor. The API is the enforcement boundary; R2 stays private and binaries never enter D1. [Interactive validated diagram](qc-studio-architecture.html) | [source specification](qc-studio-architecture.json).
