# Cat Race Simulator

Game giả lập đua mèo bằng Canvas 2D, viết bằng JavaScript ES Modules và SCSS.

## Mục tiêu dự án

- Giả lập một cuộc đua với số lượng mèo tùy chọn (2-300).
- Mỗi mèo có sprite ngẫu nhiên, tốc độ và dao động riêng.
- Có các pha rõ ràng: staging -> countdown -> racing -> winner.
- Hiển thị bảng xếp hạng top 5 theo thời gian thực và hiệu ứng chiến thắng.

## Cấu trúc thư mục hiện tại

```txt
.
├── index.html
├── package.json
├── assets/
│   └── images/
│       ├── race-bg.jpg
│       ├── winner.png
│       ├── number-1.png
│       ├── number-2.png
│       ├── number-3.png
│       ├── start-btn.png
│       ├── cat-1.png ... cat-17.png
│       └── slice1.png ... slice17.png
└── src/
    ├── main.js
    ├── constants.js
    ├── game/
    │   └── CatRace.js
    ├── utils/
    │   └── canvasPolyfills.js
    └── styles/
        ├── main.scss
        ├── _base.scss
        └── _start-screen.scss
```

## Dev setup

Yeu cau: Node.js 14+.

```bash
npm install
npm run build:styles
npm run dev
```

Mac dinh server chay tai: [http://localhost:5173](http://localhost:5173)

## Deploy (GitHub Pages + nhanh `deploy`)

Kho lưu trữ cần có remote `origin` (ví dụ `https://github.com/tmnhat1993/CatRaceSimulator.git`).

### Một lệnh (build + đẩy bản tĩnh)

```bash
npm install
npm run deploy
```

- **`npm run build`**: chạy `scripts/build-dist.mjs` — biên dịch SCSS (CSS nén) vào `src/styles/main.css`, sau đó gom `index.html`, `assets/`, `src/` (bỏ file `.scss`) vào thư mục **`dist/`** (thư mục này nằm trong `.gitignore`, không commit lên `master`).
- **`scripts/push-deploy.sh`**: tạo commit từ nội dung `dist/` và **`git push --force` lên nhánh `deploy`** trên `origin`. Bản chạy thật nằm trên nhánh `deploy`, không ghi đè lịch sử trên `master`.

### Bật GitHub Pages

Trên GitHub: **Settings → Pages → Build and deployment**: chọn **Branch `deploy`**, thư mục **`/` (root)**. Site kiểu `https://<user>.github.io/CatRaceSimulator/`.

### Chỉ build cục bộ (không push)

```bash
npm run build
```

Kiểm tra: phục vụ thư mục `dist/` bằng bất kỳ static server nào (ví dụ `npx http-server dist -p 5173`).

### Nén ảnh assets (tùy chọn, cần Node 18+)

```bash
nvm use 20   # hoặc Node >= 18
npm run compress:images
```

## Lam viec voi SCSS

```bash
npm run build:styles
npm run watch:styles
```

`build:styles` bien dich `src/styles/main.scss` -> `src/styles/main.css`.
`watch:styles` dung khi can auto build CSS trong luc chinh sua.

## Ghi chu ky thuat

- Toan bo style duoc viet bang SCSS va bien dich ra `src/styles/main.css`.
- Assets trong `assets/images`; trong code dùng đường dẫn tương đối / `import.meta.url` để vừa chạy local vừa deploy GitHub Pages (project site).
- Game logic duoc gom vao class `CatRace` de de mo rong them mode/logic trong tuong lai.
- Co polyfill `roundRect` de dam bao tuong thich trinh duyet cu (Safari cu).
