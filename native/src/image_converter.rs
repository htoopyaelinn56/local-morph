use image::{ImageFormat, Rgba, RgbaImage};
use std::io::Cursor;

// ----------------------------------------------------------------
// 1. Pure Rust Implementation
// ----------------------------------------------------------------

fn detect_image_format(input_data: &[u8]) -> Result<ImageFormat, String> {
    image::guess_format(input_data).map_err(|e| format!("Failed to detect format: {}", e))
}
pub fn convert_image_pure(input_data: &[u8], target_format_str: &str) -> Result<Vec<u8>, String> {
    // A. Guess the format
    let detected_format = detect_image_format(input_data)?;

    // B. Decode
    let mut img = image::load_from_memory_with_format(input_data, detected_format)
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    // C. Determine Output Format
    let output_format = match target_format_str.to_lowercase().as_str() {
        "png" => ImageFormat::Png,
        "jpeg" | "jpg" => ImageFormat::Jpeg,
        "gif" => ImageFormat::Gif,
        "webp" => ImageFormat::WebP,
        "bmp" => ImageFormat::Bmp,
        "ico" => ImageFormat::Ico,
        "tiff" => ImageFormat::Tiff,
        "tga" => ImageFormat::Tga,
        "ff" | "farbfeld" => ImageFormat::Farbfeld,
        f => return Err(format!("Unsupported output format requested: {}", f)),
    };

    // --- FIX: Handle Transparency for JPEG ---
    // If target is JPEG and input image has transparency, blend it onto a white background.
    if output_format == ImageFormat::Jpeg && img.color().has_alpha() {
        let rgba = img.to_rgba8();

        // 2. Create an RGBA background (White + Fully Opaque)
        // We use Rgba([255, 255, 255, 255]) so the types match the source image.
        let mut background =
            RgbaImage::from_pixel(rgba.width(), rgba.height(), Rgba([255, 255, 255, 255]));

        // 3. Overlay RGBA onto RGBA (Types now match, so no error)
        image::imageops::overlay(&mut background, &rgba, 0, 0);

        // 4. Update the image to the new blended version
        // When writing to JPEG, the encoder will ignore the alpha channel,
        // leaving you with the RGB values blended on white.
        img = image::DynamicImage::ImageRgba8(background);
    }
    // -----------------------------------------

    // D. Encode
    let mut buffer = Cursor::new(Vec::new());

    // write_to accepts ImageFormat directly in version 0.25+
    img.write_to(&mut buffer, output_format)
        .map_err(|e| format!("Failed to write output: {}", e))?;

    Ok(buffer.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    // Helper to get absolute path to assets
    fn get_asset_path(filename: &str) -> PathBuf {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        PathBuf::from(manifest_dir).join("assets").join(filename)
    }

    #[test]
    fn guess_png() {
        let img_path = get_asset_path("original.png");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let format = detect_image_format(&img_data).expect("Failed to detect format");
        assert_eq!(format, ImageFormat::Png);
    }

    #[test]
    fn guess_jpg() {
        let img_path = get_asset_path("original.jpg");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let format = detect_image_format(&img_data).expect("Failed to detect format");
        assert_eq!(format, ImageFormat::Jpeg);
    }

    #[test]
    fn guess_fail_invalid_byte() {
        let invalid_data = b"This is not an image!";
        let result = detect_image_format(invalid_data);
        assert!(result.is_err());
    }

    #[test]
    fn guess_fail_invalid_format_pdf() {
        let pdf_path = get_asset_path("dummy.pdf");
        let pdf_data = fs::read(pdf_path).expect("Failed to read test PDF");
        let result = detect_image_format(&pdf_data);
        assert!(result.is_err());
    }

    #[test]
    fn convert_png_to_jpeg() {
        let img_path = get_asset_path("original.png");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let output_data = convert_image_pure(&img_data, "jpeg").expect("Conversion failed");
        let output_format =
            detect_image_format(&output_data).expect("Failed to detect output format");

        // write output at get_asset_path with name "converted_output.jpg" for manual inspection
        let output_path = get_asset_path("output_from_png.jpeg");
        fs::write(&output_path, &output_data).expect("Failed to write output image");

        assert_eq!(output_format, ImageFormat::Jpeg);
    }

    #[test]
    fn convert_jpeg_to_png() {
        let img_path = get_asset_path("original.jpg");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let output_data = convert_image_pure(&img_data, "png").expect("Conversion failed");
        let output_format =
            detect_image_format(&output_data).expect("Failed to detect output format");

        // write output at get_asset_path with name "converted_output.png" for manual inspection
        let output_path = get_asset_path("output_from_jpg.png");
        fs::write(&output_path, &output_data).expect("Failed to write output image");

        assert_eq!(output_format, ImageFormat::Png);
    }

    #[test]
    fn convert_png_to_gif() {
        let img_path = get_asset_path("original.png");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let output_data = convert_image_pure(&img_data, "gif").expect("Conversion failed");
        let output_format =
            detect_image_format(&output_data).expect("Failed to detect output format");

        // write output at get_asset_path with name "converted_output.gif" for manual inspection
        let output_path = get_asset_path("output_from_png.gif");
        fs::write(&output_path, &output_data).expect("Failed to write output image");

        assert_eq!(output_format, ImageFormat::Gif);
    }

    #[test]
    fn convert_png_to_webp() {
        let img_path = get_asset_path("original.png");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let output_data = convert_image_pure(&img_data, "webp").expect("Conversion failed");
        let output_format =
            detect_image_format(&output_data).expect("Failed to detect output format");

        // write output at get_asset_path with name "converted_output.webp" for manual inspection
        let output_path = get_asset_path("output_from_png.webp");
        fs::write(&output_path, &output_data).expect("Failed to write output image");

        assert_eq!(output_format, ImageFormat::WebP);
    }

    #[test]
    fn convert_png_to_bmp() {
        let img_path = get_asset_path("original.png");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let output_data = convert_image_pure(&img_data, "bmp").expect("Conversion failed");
        let output_format =
            detect_image_format(&output_data).expect("Failed to detect output format");

        // write output at get_asset_path with name "converted_output.bmp" for manual inspection
        let output_path = get_asset_path("output_from_png.bmp");
        fs::write(&output_path, &output_data).expect("Failed to write output image");
        assert_eq!(output_format, ImageFormat::Bmp);
    }

    #[test]
    fn convert_png_to_ico() {
        let img_path = get_asset_path("original.png");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let output_data = convert_image_pure(&img_data, "ico").expect("Conversion failed");
        let output_format =
            detect_image_format(&output_data).expect("Failed to detect output format");

        // write output at get_asset_path with name "converted_output.ico" for manual inspection
        let output_path = get_asset_path("output_from_png.ico");
        fs::write(&output_path, &output_data).expect("Failed to write output image");
        assert_eq!(output_format, ImageFormat::Ico);
    }
}
