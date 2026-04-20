import os

def replace_words_in_files(directory, word_map, extensions=None):
    for foldername, _, filenames in os.walk(directory):
        for filename in filenames:
            if extensions and not filename.lower().endswith(tuple(extensions)):
                continue

            filepath = os.path.join(foldername, filename)

            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()

                original_content = content
                for old_word, new_word in word_map.items():
                    content = content.replace(old_word, new_word)

                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(content)
                    print(f"Replaced in: {filepath}")
            except Exception as e:
                print(f"Failed to process {filepath}: {e}")

# 🔄 Replace map: { "old_word": "new_word" }
word_replacements = {
    "LocalDateTime": "DateTime",
    "LocalDate": "DateTime",
    "Instant": "DateTime",
}

# 📁 Directory to search
directory_to_search = r"./Models"

# 🧾 Optional: restrict to certain extensions, e.g., ['.txt', '.py']
file_extensions = ['.cs']  # Set to None to scan all files

replace_words_in_files(directory_to_search, word_replacements, file_extensions)

directory_to_search = r"./PriceHistoryModels"
replace_words_in_files(directory_to_search, word_replacements, file_extensions)
