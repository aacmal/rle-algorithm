use serde::{Deserialize, Serialize};
use tauri::command;

// Struct to hold compression results
#[derive(Serialize, Deserialize)]
pub struct CompressionResult {
    original_size: usize,
    compressed_size: usize,
    compressed_content: String,
    compression_ratio: f64,
}

// Struct to hold decompression results
#[derive(Serialize, Deserialize)]
pub struct DecompressionResult {
    compressed_size: usize,
    decompressed_size: usize,
    decompressed_content: String,
    expansion_ratio: f64,
}

#[command]
fn compress_rle(input: &str) -> CompressionResult {
    let original_size = input.len();

    if original_size == 0 {
        return CompressionResult {
            original_size: 0,
            compressed_size: 0,
            compressed_content: String::new(),
            compression_ratio: 0.0,
        };
    }

    let mut result = String::new();
    let mut count = 1;
    let mut chars = input.chars();
    let mut current = chars.next().unwrap();

    for ch in chars {
        if ch == current {
            count += 1;
        } else {
            result.push_str(&count.to_string());
            result.push(current);
            current = ch;
            count = 1;
        }
    }

    // Don't forget the last character
    result.push_str(&count.to_string());
    result.push(current);

    let compressed_size = result.len();
    let compression_ratio = if original_size > 0 {
        100.0 - (compressed_size as f64 / original_size as f64) * 100.0
    } else {
        0.0
    };

    CompressionResult {
        original_size,
        compressed_size,
        compressed_content: result,
        compression_ratio,
    }
}

#[command]
fn decompress_rle(input: &str) -> DecompressionResult {
    let compressed_size = input.len();
    let mut result = String::new();
    let mut i = 0;
    let input_bytes = input.as_bytes();

    while i < input_bytes.len() {
        let mut count_str = String::new();

        // Parse the count digits
        while i < input_bytes.len() && input_bytes[i].is_ascii_digit() {
            count_str.push(input_bytes[i] as char);
            i += 1;
        }

        // Parse the character to repeat
        if i < input_bytes.len() && !count_str.is_empty() {
            let count = count_str.parse::<usize>().unwrap_or(0);
            let ch = input_bytes[i] as char;

            // Append the character 'count' times
            for _ in 0..count {
                result.push(ch);
            }

            i += 1;
        } else {
            // If we can't parse properly, just move to the next character
            if i < input_bytes.len() {
                i += 1;
            }
        }
    }

    let decompressed_size = result.len();
    let expansion_ratio = if compressed_size > 0 {
        (decompressed_size as f64 / compressed_size as f64) * 100.0 - 100.0
    } else {
        0.0
    };

    DecompressionResult {
        compressed_size,
        decompressed_size,
        decompressed_content: result,
        expansion_ratio,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![compress_rle, decompress_rle])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
