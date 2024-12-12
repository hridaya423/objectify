# Objectify 🕵️‍♀️🔍

## Project Overview

Objectify is an advanced object detection web application powered by TensorFlow's COCO-SSD (Common Objects in Context - Single Shot Multibox Detector) model. The application provides real-time object detection capabilities with a modern, responsive user interface.

![Project Preview](https://cloud-fhubke6oq-hack-club-bot.vercel.app/0image.png)

## 🌟 Features

- **Real-Time Object Detection**: Instantly identify and classify objects in images
- **Responsive UI**: Built with Tailwind CSS and shadcn components
- **Modern Design**: Sleek icons from Lucide React

## 🛠 Tech Stack

- **Framework**: Next.js
- **UI Framework**: 
  - Tailwind CSS
  - shadcn/ui
- **Icons**: Lucide React

## 📋 Prerequisites

Before installation, ensure you have:
- Node.js (v18.0.0 or later)
- npm (v8.0.0+) or Yarn
- Modern web browser with WebGL support

## 🔧 Installation and Setup

### 1. Clone the Repository

```bash
# HTTPS
git clone https://github.com/hridaya423/objectify.git

# Or SSH
git clone git@github.com:hridaya423/objectify.git

# Navigate to project directory
cd objectify
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using Yarn
yarn install
```
### 3. Run Development Server

```bash
# Using npm
npm run dev

# Or using Yarn
yarn dev
```

🌐 Access the application at: `http://localhost:3000`

## 🚀 Production Build

Prepare the application for production:

```bash
# Using npm
npm run build
npm start

# Using Yarn
yarn build
yarn start
```


## 🛡️ Limitations

- Works best with common objects in the COCO dataset
- Performance varies with image quality
- Requires client-side processing
- May struggle with complex or occluded objects
