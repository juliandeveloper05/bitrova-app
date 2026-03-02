# Contributing to Bitrova

## 🌳 Branching Strategy (GitFlow)

We follow a strict workflow to ensure stability:

* **`master`**: Production-ready code. 🔴 **DO NOT PUSH DIRECTLY.**
* **`develop`**: The integration branch. All PRs must target this branch. 🟢
* **Feature Branches**: Create a new branch for every task.
    * `feat/feature-name` (for new features)
    * `fix/bug-name` (for bug fixes)

## 🚀 Workflow

1.  **Create an Issue** in the Project Board.
2.  **Checkout** to a new branch: `git checkout -b feat/my-feature`.
3.  **Work & Commit** using clear messages in English.
4.  **Push** your branch and open a **Pull Request (PR)** targeting `develop`.
5.  **Code Review**: Wait for approval before merging.

## 🐛 Bug Reporting
If you find a bug, please create an Issue using the "Bug" label and link it to the Project Board.
