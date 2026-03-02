# ECE1724H_Advanced_Web
- I-Hsuan Ho 1012638022
- Der-Chien Chang 1005978596
- Kuan-Yu Chang 1007359760
- Chia-Chun Wu 1012134101

---
## Motivation
Beginners learning deep learning for NLP often struggle with the fragmented and code-heavy workflow required for even basic text classification tasks. Preparing datasets, preprocessing text, configuring models, training, tracking metrics, and interpreting outputs such as confusion matrices or learning curves typically involve substantial boilerplate code across notebooks and scripts. This setup overhead slows experimentation and shifts focus away from conceptual understanding.

LearnDL addresses this gap by providing a guided, UI-driven platform that makes the full text-classification workflow repeatable and explorable. Users can modify preprocessing steps and hyperparameters and immediately observe changes in performance and interpretability, enabling rapid, feedback-driven learning aligned with course assignments. The primary target users are students in DL/NLP courses and beginners seeking a structured sandbox for tasks such as sentiment analysis, spam detection, and topic classification. Unlike notebooks, which require coding expertise and ad hoc experiment tracking, and AutoML platforms, which prioritize final metrics while obscuring training behavior, LearnDL emphasizes transparency, iteration, and learning efficiency.

---
## Objective and Key Features

### Objectives
Build a full-stack web application where authenticated users can upload/select a text dataset, configure preprocessing and training settings, run model training as a job with progress updates, view educational visualizations, and store each run in a per-user training archive with downloadable model artifacts.


### Core Technical Compnents

#### 1. Technical Implementation
We will use Next.js backend (TypeScript) + React (TypeScript) frontend:

- **Prototype Design:** Figma
- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** Next.js + TypeScript REST API
- **Database:** PostgreSQL
- **Reason:** clean separation of concerns and easier async job orchestration (training pipeline) without mixing server actions into the UI layer.


#### 2. Database Schema and Relationship
We will use PostgreSQL (relational database) with the following schema design, aligned with the application workflow:

1. **Users**
Stores authenticated user accounts.

```
  users
  - id (PK)
  - name
  - email (unique)
  - hashed_pwd
  - created_at
  - updated_at
```

2. **Training Sessions**
Represents one complete training run (shown in Archive sidebar).

```
  training_sessions
  - id (PK)
  - user_id (FK → users.id)
  - model_name
  - chosen_model
  - hyper_params (JSON)
  - csv_url (S3 path)
  - model_url (S3 path)
  - figures_url (S3 base path)
  - created_at
```

3. **Dataset Storage (S3 – CSV files)**
Datasets are stored in S3 as .csv.

```
  datasets
  - user_id (FK)
  - training_session_id (FK)
  - csv_url (S3 path)
```

4. **Model Artifacts (S3 – .pt / .pth)**
Trained models are packaged and stored in S3.
```
  models
  - user_id (FK)
  - training_session_id (FK)
  - model_name
  - hyper_params (JSON)
  - model_url (S3 path)
  - metrics (JSON)
```

5. **Figures (S3 – .png or generated plots)**
Visualization outputs (Ex. confusion matrix, learning curve) are generated after training and stored in S3.
```
  figures
  - user_id (FK)
  - training_session_id (FK)
  - conf_matrix_url (S3 path)
  - learning_curve_url (S3 path)
```

#### 3. File Storage Requirements

Use **S3-compatible object storage** for large files:

- Uploaded CSV datasets (raw + processed)
- Model artifacts packaged as `.zip`
- Visualization figures

DB stores only **metadata and file paths/URLs**, not raw binary blobs.


#### 4. UI and Experience Design
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/main_page.png)

- **Training Page**
    - Dataset dropdown (built-in + upload)
    - Preprocessing toggles (lowercase, punctuation, stopwords, lemmatization optional)
    - Model selection (BiLSTM+GloVe, DistilBERT, RoBERTa)
    - Hyperparameters (epochs, batch size, learning rate, fine-tune toggle)
    - “Start Training” button + training progress status
 
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/prediction.png)
 
- **Prediction Page**
    - Model dropdown (user’s completed runs)
    - Text input area + Predict button
    - Output label + confidence (optionally token highlights)
 
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/archive_details.png)
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/training_result.png)
![Main Page](https://github.com/cc5u/ECE1724H_Advanced_Web/blob/main/proposal_images/training_result2.png)

- **Archive Page**
    - **Left sidebar**: per-user run history cards (model/dataset/date/accuracy)
    - **Run detail** shows:
        - Dataset summary
        - First 10 samples table
        - Hyperparameter configuration
        - Training results (metrics cards + confusion matrix + learning curve)
        - Download model zip


#### 5. Planned Advanced Feature(At Least Two)
We will implement **at least two** (we plan 4 to be safe):

1. **Authentication & authorization**
- Register/login/logout
- Protected API routes
- Per-user isolation (users can only see their own runs and files)
1. **Real-time progress updates**
- Training is asynchronous
- Frontend receives live status updates via **SSE** (simpler than WebSocket) showing:
    - current epoch, loss/accuracy, status
1. **Non-trivial file handling**
- CSV upload + server-side validation and column mapping
- Derived artifacts generation (processed preview + model.zip)
1. **AI Chatbot Result Explanation**
- Floating AI chatbot (bottom-right corner) available across Training, Archive, and Prediction pages
- Context-aware: when viewing a specific training run, the chatbot can explain:
    - metrics (accuracy, precision, recall, F1)
    - confusion matrix interpretation
    - learning curves (overfitting/underfitting)
    - hyperparameter effects
    - prediction confidence and token importance
- Backend retrieves run data (metrics, hyperparameters, confusion matrix, curves) and sends structured context to the LLM
- Strict per-user isolation: chatbot can only access the authenticated user’s training sessions


## Tentative Plan
| Week | I-Hsuan Ho | Der-Chien Chang | Kuan-Yu Chang | Chia-Chun Wu |
|------|------------|-----------------|---------------|--------------|
| **Week 1 (March 2, 2026)** | • Cloud setup + S3 connection test<br>• Signed URL upload + validation | • Design Prototype<br>• Prediction API<br>• Model training pipeline | • DB schema + authentication<br>• Dataset API + ownership checks | • Implement UI skeleton (3 pages)<br>• Auth UI for login/register |
| **Week 2 (March 9, 2026)** | • Artifact storage structure<br>• Zip packaging pipeline | • Model training pipeline<br>• Model Result Visualization components Pipeline (model, cloud, render frontend) | • Dataset API + ownership checks<br>• Secure artifact endpoints | • Dataset upload UI components and dropdown<br>• History sidebar UI<br>• Prediction page |
| **Week 3 (March 16, 2026)** | • Presentation Slides and Rehearsal<br>• Artifact download URLs | • Presentation Slides and Rehearsal | • Presentation Slides and Rehearsal | • Presentation Slides and Rehearsal |
| **Week 4 (March 23, 2026)** | • Testing/Debugging<br>• Performance sanity checks<br>• Edge case validation | • Testing/Debugging<br>• Performance sanity checks<br>• Edge case validation | • Testing/Debugging<br>• Performance sanity checks<br>• Edge case validation | • Testing/Debugging<br>• Performance sanity checks<br>• Edge case validation |


## Initial Independent Reasoning (Before using AI)


## AI Assistance Disclosure
