from ultralytics import YOLO
model=YOLO('models/snake_model.pt')
res=model.predict(source='data/train/images/771967_01e948b8de6341bdabbba2d848f27673-mv2_webp.rf.ccdfe1dc979b8a240f2562c97dced3a7.jpg', conf=0.1, verbose=False)
print(res)
print('boxes', res[0].boxes)
print('n', len(res[0].boxes) if res[0].boxes is not None else 0)
