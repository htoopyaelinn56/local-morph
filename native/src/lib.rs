use wasm_bindgen::JsError;
use wasm_bindgen::prelude::wasm_bindgen;
use crate::image_converter::convert_image_pure;

mod image_converter;

#[wasm_bindgen]
pub fn convert_image(input_data: &[u8], target_format_str: &str) -> Result<Vec<u8>, JsError> {

    // (Optional) Side effect: Logging to JS Console
    if let Ok(fmt) = image::guess_format(input_data) {
        web_sys::console::log_1(&format!("Detected input image format: {:?}", fmt).into());
    }

    // Call the pure Rust function
    match convert_image_pure(input_data, target_format_str) {
        Ok(bytes) => Ok(bytes),
        Err(e) => Err(JsError::new(&e)),
    }
}