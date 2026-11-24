const MAX_WIDTH = 1280;
const QUALITY = 0.85;

const resizeImageFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
        return file;
    }

    let bitmap;

    try {
        bitmap = await createImageBitmap(file);
    } catch {
        return file;
    }

    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
        bitmap.close?.();
        return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", QUALITY)
    );

    if (!blob || blob.size >= file.size) {
        return file;
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "thumbnail";

    return new File([blob], `${name}.webp`, {
        type: "image/webp",
    });
};

export default resizeImageFile;
