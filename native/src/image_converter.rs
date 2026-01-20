use image::ImageFormat;
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
    let img = image::load_from_memory_with_format(input_data, detected_format)
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    // C. Determine Output Format (using ImageFormat enum)
    let output_format = match target_format_str.to_lowercase().as_str() {
        "png" => ImageFormat::Png,
        "jpeg" | "jpg" => ImageFormat::Jpeg, // Uses default quality (usually 75-80)
        "gif" => ImageFormat::Gif,
        "webp" => ImageFormat::WebP,
        "bmp" => ImageFormat::Bmp,
        "ico" => ImageFormat::Ico,
        "tiff" => ImageFormat::Tiff,
        "tga" => ImageFormat::Tga,
        "ff" | "farbfeld" => ImageFormat::Farbfeld,
        f => return Err(format!("Unsupported output format requested: {}", f)),
    };

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
        let img_path = get_asset_path("original_png_img.png");
        let img_data = fs::read(img_path).expect("Failed to read test image");
        let format = detect_image_format(&img_data).expect("Failed to detect format");
        assert_eq!(format, ImageFormat::Png);
    }

    #[test]
    fn guess_jpg() {
        let img_path = get_asset_path("original_jpg_img.jpg");
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
}
