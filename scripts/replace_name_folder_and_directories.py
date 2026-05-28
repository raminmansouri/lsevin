import os

def replace_word_in_directory(directory, target_word, new_word):
    """
    Recursively replaces occurrences of `target_word` with `new_word` in all files
    (both text content and filenames) within the given directory and its subdirectories.
    
    Args:
        directory (str): The base directory to process.
        target_word (str): The word to replace.
        new_word (str): The replacement word.
    """
    for entry in os.walk(directory):
        for file in entry[2]:
            current_path = os.path.join(directory, file)
            new_name = file.replace(target_word, new_word)
            new_path = os.path.join(directory, new_name)

            filename = current_path
            
            if os.path.isfile(filename):
                with open(filename, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content.replace(target_word, new_word)
                
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(new_content)
            elif os.path.isdir(filename):
                replace_word_in_directory(filename, target_word, new_word)
            os.rename(filename,new_path)

def main():
    import sys
    if len(sys.argv) != 4:
        print("Usage: python script.py <input_directory> <target_word> <new_word>")
        return
    
    input_directory = sys.argv[1]
    target_word = sys.argv[2]
    new_word = sys.argv[3]
    
    try:
        replace_word_in_directory(input_directory, target_word, new_word)
        print(f"Word replacement completed in {input_directory}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()


# rep.py F:/workplace/lsevin/src/Modules/Customer/LSevin.Modules.Customer/Customer/Features/Bookings Explore Bookings
<<<<<<< HEAD
# py replace_name_folder_and_directories.py F:/workplace/lsevin/src/Modules/Customer/LSevin.Modules.Customer/Customer/Features/GetNotificationCount Bookings GetNotificationCount
# py replace_name_folder_and_directories.py F:\workplace\lsevin\src\Modules\Category\LSevin.Modules.Category\ServiceProvider\Features\GetServicePageById GetServiceProviderByIdPublic  GetProviderPageData
#F:\workplace\lsevin\src\Modules\Customer\LSevin.Modules.Customer\Customer\Features\GetNotificationCount
=======
# py replace_name_folder_and_directories.py F:/workplace/lsevin/src/Modules/Customer/LSevin.Modules.Customer/Customer/Features/Bookings Explore Bookings
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
