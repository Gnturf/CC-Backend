import express from "express";
import dotenv from "dotenv";
import { checkAuthToken } from "./middlewares/auth.middleware.js";
import usersRoutes from "./routers/users.routes.js";
import soilsRoutes from "./routers/soils.routes.js";
import plantsRoutes from "./routers/plants.routes.js";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import tf from '@tensorflow/tfjs';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/users", usersRoutes);
app.use("/soils", soilsRoutes);
app.use("/plants", plantsRoutes);

const upload = multer({
  dest: "uploads/", // Temporary directory for uploaded files (optional)
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB (adjust as needed)
});

let model;
const loadModel = async () => {
    model = await tf.loadLayersModel('https://storage.googleapis.com/tanam-pintar-bucket/model/model.json');
};
loadModel();

app.post('/predict', upload.single('image'), async (req, res) => {
    try {
        const imageBuffer = Buffer.from(req.body.image, 'base64');
        let tensor = tf.node.decodeImage(imageBuffer);
        tensor = tensor.resizeBilinear([224, 224]).expandDims(0).toFloat().div(tf.scalar(255));
        const prediction = model.predict(tensor);
        const predictedClass = tf.argMax(prediction, 1);
        res.json({ prediction: predictedClass.dataSync()[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing prediction' });
    }
});

app.listen(PORT, "0.0.0.0", 511, () => {
  console.log(`Server was running at http://localhost:${PORT}`);
});
