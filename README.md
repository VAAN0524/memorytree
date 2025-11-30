# 🌳 MemoryTree - 3D Interactive Photo Gallery

<div align="center">
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/MediaPipe-FF6F00?style=for-the-badge&logo=mediapipe&logoColor=white" alt="MediaPipe">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</div>

A revolutionary 3D interactive photo gallery that combines immersive WebGL graphics with cutting-edge hand gesture recognition. Transform your photo viewing experience into an intuitive, magical journey through memories arranged in a stunning 3D sphere.

## ✨ Key Features

### 🎮 **Gesture-Controlled Interface**
- **Hand Tracking**: MediaPipe-powered real-time hand detection
- **Intuitive Controls**: Natural hand gestures for navigation
- **Dual-Hand Support**: Both hands for zoom control, right hand for rotation and selection
- **Fallback Mode**: Mouse controls when camera is unavailable

### 🌐 **3D Visualization**
- **Spherical Layout**: Photos arranged in an immersive 3D sphere
- **Crystal Ball Effect**: Elegant initial state with explosive transitions
- **Smooth Animations**: Fluid movement between photo arrangements
- **Responsive Design**: Adapts to different screen sizes

### 🖼️ **Interactive Experience**
- **Hover Effects**: Photos enlarge when hovered
- **Detail Mode**: Full-screen photo viewing with gesture controls
- **Auto-Rotation**: Gentle spinning when idle
- **Dynamic Lighting**: Enhanced visual atmosphere

## 🚀 Quick Start / 快速开始

### Prerequisites / 前置要求
- Node.js (version 16 or higher / 版本16或更高)
- Modern web browser with WebGL support / 支持WebGL的现代浏览器
- Webcam (for gesture controls / 用于手势控制) / 摄像头

### Installation / 安装

```bash
# Clone the repository / 克隆仓库
git clone https://github.com/VAAN0524/memorytree.git
cd memorytree

# Install dependencies / 安装依赖
npm install

# Start development server / 启动开发服务器
npm run dev
```

### Usage / 使用方法

1. **Launch the Application**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`

2. **Allow Camera Access**
   - Grant camera permissions when prompted
   - Ensure good lighting for optimal hand tracking

3. **Start Interacting**
   - Begin with the crystal ball view
   - Use any pinch gesture to explode into the photo sphere

## 🎯 Controls Guide / 操控指南

### 🙌 Both Hands Controls / 双手控制 (NEW)
| Gesture / 手势 | Action / 操作 | Description / 描述 |
|---------|--------|-------------|
| **Hands Together / 双手合掌** | **Zoom In / 缩小** | Bring both hands together to shrink the photo sphere / 双手合掌缩小照片球体 |
| **Hands Apart / 双手分开** | **Zoom Out / 放大** | Separate both hands to expand the photo sphere / 双手分开放大照片球体 |
| **Hand Distance / 手部距离** | **Scale Control / 缩放控制** | 3D distance between hands maps to zoom factor with smooth transitions / 双手3D距离映射到缩放因子，支持平滑过渡 |

### ✋ Right Hand Controls / 右手控制
| Gesture / 手势 | Action / 操作 | Description / 描述 |
|---------|--------|-------------|
| **Move / 移动** | **Rotate / 旋转** | Move hand to rotate photo sphere in 3D space / 移动手掌在3D空间中旋转照片球体 |
| **Pinch / 捏合** | **Select / 选择** | Point and pinch to select/view a photo / 指向照片并捏合以选择/查看 |
| **Double Pinch / 双捏合** | **Detail Mode / 详情模式** | Quick double-pinch on a photo to enter full-screen view / 快速双捏合照片进入全屏视图 |
| **Swipe Left/Right / 左右滑动** | **Navigate / 导航** | In detail mode, swipe to switch between photos / 详情模式下滑动切换照片 |
| **Fist / 握拳** | **Exit / 退出** | In detail mode, make a fist to return to sphere view / 详情模式下握拳返回球体视图 |

### 🖥️ Interface Features / 界面功能
- **Control Panel / 控制面板**: Adjust settings in the top-right corner / 在右上角调整设置
- **Immersive Camera / 沉浸式相机**: Toggle webcam background for augmented reality effect / 切换摄像头背景以实现增强现实效果
- **Status Display / 状态显示**: Real-time gesture and system status information / 实时手势和系统状态信息
- **Cursor Indicator / 光标指示器**: Visual feedback for hand tracking position / 手部追踪位置的视觉反馈

## 🏗️ Technical Architecture

### Core Technologies
- **Three.js**: 3D graphics rendering and scene management
- **TypeScript**: Type-safe development with modern ES6+ features
- **MediaPipe**: Google's hand tracking and gesture recognition
- **Vite**: Fast development server and build tooling

### Project Structure
```
memorytree/
├── src/
│   ├── core/           # Core 3D systems
│   │   ├── ThreeScene.ts      # Three.js scene management
│   │   ├── PhotoSystem.ts     # Photo layout and interactions
│   │   └── ExplosionSystem.ts # Visual effects
│   ├── vision/         # Hand tracking
│   │   └── VisionManager.ts   # MediaPipe integration
│   ├── ui/             # User interface
│   │   └── UIManager.ts       # UI controls and feedback
│   ├── shapes/         # 3D geometry
│   │   └── ShapeGenerator.ts  # Photo positioning
│   └── main.ts         # Application entry point
├── public/
│   └── photos/         # Photo collection (130+ images)
└── dist/               # Built application
```

### System Components

#### **ThreeScene** (`src/core/ThreeScene.ts`)
- WebGL renderer setup and management
- Camera controls and perspective
- Animation loop and performance optimization
- Window resizing and responsive behavior

#### **PhotoSystem** (`src/core/PhotoSystem.ts`)
- Photo texture loading and caching
- 3D positioning in spherical layout
- State management (Crystal Ball → Sphere → Detail modes)
- Smooth transitions and animations

#### **VisionManager** (`src/vision/VisionManager.ts`)
- MediaPipe hand landmark detection
- Gesture recognition algorithms
- Real-time cursor tracking
- Hand coordinate normalization

#### **UIManager** (`src/ui/UIManager.ts`)
- On-screen cursor rendering
- Control panel interface
- Status information display
- User feedback systems

## 🎨 Visual Features

### **Photo Collection**
- **130+ High-Quality Images**: Diverse collection of scenic and artistic photos
- **Optimized Loading**: Efficient texture management for smooth performance
- **Automatic Resizing**: Responsive scaling for different devices

### **Visual Effects**
- **Particle Explosions**: Dramatic transitions between states
- **Smooth Animations**: 60 FPS rendering with optimized performance
- **Dynamic Lighting**: Ambient and directional lighting for depth
- **Anti-Aliasing**: Crisp visuals at any resolution

## 🔧 Development

### Build System
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Configuration Files
- **`tsconfig.json`**: TypeScript configuration with strict type checking
- **`vite.config.js`**: Vite build tool configuration
- **`package.json`**: Dependencies and npm scripts

### Code Style
- **TypeScript Strict Mode**: Ensuring type safety throughout
- **Modular Architecture**: Clean separation of concerns
- **Performance Optimized**: Efficient rendering and memory management
- **Error Handling**: Graceful degradation for unsupported features

## 🐛 Troubleshooting

### **Common Issues**

**Hand Tracking Not Working**
- ✅ Ensure camera permissions are granted
- ✅ Check lighting conditions (bright, even lighting works best)
- ✅ Verify hands are fully visible in camera frame
- ✅ Try moving closer to or further from camera

**Performance Issues**
- ✅ Close other browser tabs and applications
- ✅ Ensure hardware acceleration is enabled in browser
- ✅ Check if graphics drivers are up to date
- ✅ Try reducing photo quality in settings

**Camera Access Denied**
- ✅ Refresh page and grant camera permissions when prompted
- ✅ Check browser settings for camera access
- ✅ Try using a different browser (Chrome, Firefox, Safari)

**Vision Load Failed**
- ✅ Check internet connection for MediaPipe model download
- ✅ Try refreshing the page
- ✅ System will fall back to demo mode if vision fails

### **Browser Compatibility**
- **Chrome**: Full support with best performance
- **Firefox**: Good support with slight performance differences
- **Safari**: Supported, may require permission prompts
- **Edge**: Supported on recent versions

## 🤝 Contributing

We welcome contributions to enhance MemoryTree! Here's how you can help:

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and submit a pull request

### **Areas for Improvement**
- **Enhanced Gestures**: Additional two-hand and single-hand gesture controls
- **Photo Organization**: Albums, categories, and metadata
- **Visual Themes**: Customizable color schemes and effects
- **Performance**: Optimization for low-end devices
- **Accessibility**: Features for users with different abilities

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js Team** - For the amazing 3D graphics library
- **Google MediaPipe** - For cutting-edge hand tracking technology
- **Vite Contributors** - For the fast and modern development tool
- **The Open Source Community** - For making these technologies possible

## 📞 Contact

Have questions, suggestions, or want to share your MemoryTree experience?

- **GitHub Issues**: [Report bugs or request features](https://github.com/VAAN0524/memorytree/issues)
- **Author**: VAAN0524

---

<div align="center">
  <strong>🌳 Transform your photos into an immersive, interactive experience 🌳</strong>
</div>