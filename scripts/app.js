document.getElementById('upload-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    const statusDiv = document.getElementById('status');
    const progressBar = document.getElementById('progress-bar');
    const uploadButton = document.querySelector('button[type="submit"]');

    // Disable the upload button and show a spinner while processing
    uploadButton.disabled = true;
    uploadButton.innerHTML = 'Processing... <span class="spinner"></span>';

    // Check if files are selected
    if (!files.length) {
        statusDiv.textContent = 'Please select files.';
        return;
    }

    const zip = new JSZip(); // Create a new JSZip instance
    let progress = 0;
    const totalFiles = files.length;

    // Update progress bar
    const updateProgress = (progress) => {
        progressBar.style.width = `${progress}%`;
    };

    // Iterate over the selected files and convert them
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase(); // Ensure case-insensitive matching
        const folderPath = file.webkitRelativePath ? file.webkitRelativePath.replace(/\/[^/]+$/, '') : '';

        // Only process .heic and .jpeg files
        if (/\.heic$/i.test(fileName)) {
            try {
                // Read the HEIC file as a Blob
                const blob = file.slice(0, file.size);

                // Convert the HEIC file to JPEG
                console.log(`Converting file: ${file.name}`);
                const conversionResult = await heic2any({
                    blob,
                    toType: 'image/jpeg', // Ensure JPEG conversion
                    quality: 0.8, // Set quality for JPEG (optional)
                });

                // Check if conversionResult is a Blob and not undefined
                if (conversionResult instanceof Blob) {
                    // Create a new file name for the JPEG file
                    const jpegFileName = fileName.replace(/\.heic$/i, '.jpeg'); // Ensure .jpeg extension
                    const zipFilePath = folderPath ? `${folderPath}/${jpegFileName}` : jpegFileName;
                    console.log(`Adding ${jpegFileName} to zip`);
                    zip.file(zipFilePath, conversionResult);
                } else {
                    console.error('Conversion result is not a Blob:', conversionResult);
                    statusDiv.textContent = 'Error: Conversion did not return a valid image.';
                    return;
                }
            } catch (error) {
                console.error('Error converting HEIC to JPEG:', error);
                statusDiv.textContent = 'Error converting some files.';
                return;
            }
        } else if (/\.jpeg$/i.test(fileName)) {
            // If it's a .jpeg file, just add it directly to the zip without conversion
            const jpegFileName = fileName; // Use the original file name
            const zipFilePath = folderPath ? `${folderPath}/${jpegFileName}` : jpegFileName;
            zip.file(zipFilePath, file);
            console.log(`Adding .jpeg file: ${jpegFileName} to zip`);
        } else {
            console.log(`Skipping non-image file: ${fileName}`);
        }

        // Update progress bar
        progress = Math.floor(((i + 1) / totalFiles) * 100);
        updateProgress(progress);
    }

    // After all files are processed, generate the zip file
    zip.generateAsync({ type: 'blob' }).then(function (content) {
        console.log('Generated ZIP content:', content); // Log the generated ZIP content

        // Create a download link for the generated ZIP
        const folderName = files[0].webkitRelativePath.split('/')[0]; // Get the folder name from the first file
        const zipFileName = `${folderName}_converted_images.zip`; // Use the folder name as part of the ZIP filename
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(content);
        downloadLink.download = zipFileName;
        downloadLink.click();

        // Reset progress bar and button
        updateProgress(0);
        statusDiv.textContent = 'Conversion completed. Downloading ZIP file...';
        uploadButton.disabled = false;
        uploadButton.innerHTML = 'Upload and Convert';
    }).catch((error) => {
        console.error('Error generating ZIP file:', error);
        statusDiv.textContent = 'Error generating ZIP file.';
        uploadButton.disabled = false;
        uploadButton.innerHTML = 'Upload and Convert';
    });
});
