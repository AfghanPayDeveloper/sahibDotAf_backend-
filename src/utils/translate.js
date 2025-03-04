import axios from 'axios';

const translateText = async (text, targetLanguage) => {
    try {
        const response = await axios.get('https://api.mymemory.translated.net/get', {
            params: {
                q: text,
                langpair: `en|${targetLanguage}`, // Example: en|fa for English to Persian
            },
        });
        return response.data.responseData.translatedText;
    } catch (error) {
        console.error('Error translating text:', error.message);
        throw new Error('Translation failed');
    }
};

export default translateText;
