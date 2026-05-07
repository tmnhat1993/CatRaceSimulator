# Cat Race Simulator

Game giả lập đua mèo bằng Canvas 2D, viết bằng JavaScript ES Modules và SCSS.

## Mục tiêu dự án

- Giả lập một cuộc đua với số lượng mèo tùy chọn (2–300).
- Mỗi mèo có sprite ngẫu nhiên, tốc độ và dao động riêng.
- Có các pha rõ ràng: staging → countdown → racing → winner.
- Hiển thị bảng xếp hạng top 5 theo thời gian thực (có thể ẩn sau một mốc trong đua; xem bên dưới) và hiệu ứng chiến thắng.

## Cách chơi / điều khiển

- Nhập **số mèo tham gia** (2–300), sau đó bấm nút Start **hoặc phím Enter** trong ô nhập để bắt đầu ngay.
- Khi màn hình kết quả hiển thị, **click vào canvas** để về màn hình chọn và chơi lại.

## Cân bằng đua (tóm tắt)

- **Nhóm đầu / đuôi đàn:** phần lớn mèo phía trước bị giảm nhịp surge; phần đuôi được buff surge để bám sát (xem `TOP_PACK_*`, `TAIL_PACK_*` trong `src/constants.js`).
- **Mèo đang dẫn đầu (trong số con chưa về đích):** surge và nhịp chạy bị hệ số riêng **yếu hơn cả nhóm đầu**, để đàn phía sau có cơ hội vượt; ai vượt lên nhất sẽ chịu penalty tương tự (`RACE_LEADER_SURGE_MULT`, `RACE_LEADER_PACE_MULT`).
- **Thanh top 5:** sau khi có đủ **5** mèo về đích (hoặc **tất cả** mèo nếu bạn chọn ít hơn 5 con), thanh xếp hạng trên cùng **ẩn** và **không** cập nhật / animate nữa.

## Cấu trúc thư mục hiện tại

```txt
.
├── index.html
├── package.json
├── assets/
│   └── images/
│       ├── main-bg.jpg
│       ├── road-sprite.png (và road-sprite.jpg)
│       ├── race-bg.jpg
│       ├── winner.png, begin-txt.png
│       ├── number-1.png … number-3.png
│       ├── start-btn.png
│       ├── cat-1.png … cat-17.png
│       └── slice1.png … slice17.png
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

**Yêu cầu:** Node.js 14+.

```bash
npm install
npm run build:styles
npm run dev
```

Mặc định server chạy tại: [http://localhost:5173](http://localhost:5173)

## Deploy (GitHub Pages + nhánh `deploy`)

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

## Làm việc với SCSS

```bash
npm run build:styles
npm run watch:styles
```

`build:styles` biên dịch `src/styles/main.scss` → `src/styles/main.css`.  
`watch:styles` dùng khi cần auto build CSS trong lúc chỉnh sửa.

## Ghi chú kỹ thuật

- Toàn bộ style được viết bằng SCSS và biên dịch ra `src/styles/main.css`.
- Assets trong `assets/images`; trong code dùng đường dẫn tương đối / `import.meta.url` để vừa chạy local vừa deploy GitHub Pages (project site).
- Game logic được gom vào class `CatRace` để dễ mở rộng thêm mode/logic trong tương lai.
- Có polyfill `roundRect` để đảm bảo tương thích trình duyệt cũ (Safari cũ).
