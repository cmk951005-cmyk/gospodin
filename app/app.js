let reviews = [];

async function loadReviews() {
    try {
        const response = await fetch('reviews_test.tsv');
        const tsvData = await response.text();
        Papa.parse(tsvData, {
            header: true,
            delimiter: '\t',
            complete: function(results) {
                reviews = results.data.map(row => row.text).filter(text => text);
            }
        });
    } catch (error) {
        showError('Failed to load reviews file');
    }
}

async function analyzeRandomReview() {
    clearResults();
    if (reviews.length === 0) {
        showError('No reviews loaded yet');
        return;
    }

    const randomReview = reviews[Math.floor(Math.random() * reviews.length)];
    document.getElementById('review').textContent = randomReview;

    const token = document.getElementById('token').value.trim();
    await queryHuggingFace(randomReview, token);
}

async function queryHuggingFace(reviewText, token) {
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
            'https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english',
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ inputs: reviewText }),
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        displayResult(data[0]);
    } catch (error) {
        showError(error.message);
    }
}

function displayResult(result) {
    const resultDiv = document.getElementById('result');
    let icon = 'fa-question-circle';
    let color = 'gray';

    if (result && result.length > 0) {
        const sentiment = result[0];
        if (sentiment.label === 'POSITIVE' && sentiment.score > 0.5) {
            icon = 'fa-thumbs-up';
            color = 'green';
        } else if (sentiment.label === 'NEGATIVE' && sentiment.score > 0.5) {
            icon = 'fa-thumbs-down';
            color = 'red';
        }
    }

    resultDiv.innerHTML = `<i class="fas ${icon}" style="color: ${color}"></i>`;
}

function showError(message) {
    document.getElementById('error').textContent = message;
}

function clearResults() {
    document.getElementById('error').textContent = '';
    document.getElementById('result').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', loadReviews);