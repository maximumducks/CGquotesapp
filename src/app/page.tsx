'use client';

import { useState, useEffect } from 'react';
import { PulseLoader } from 'react-spinners';
import styles from './page.module.css';

interface Quote {
  content: string;
  author: string;
  id?: string;
}

export default function Home() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Quote[]>([]);

  const fetchWithTimeout = async (url: string, options = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  const fetchNewQuote = async (retries = 3) => {
    setLoading(true);
    let attempt = 0;
    
    while (attempt < retries) {
      try {
        console.log(`Attempt ${attempt + 1} to fetch quote`);
        const response = await fetchWithTimeout('/api/quote', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        });
        
        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (!response.ok || responseData.error) {
          console.error('Error response:', responseData);
          throw new Error(responseData.details || `HTTP error! status: ${response.status}`);
        }
        
        if (!responseData || !responseData.content || !responseData.author) {
          console.error('Invalid data received:', responseData);
          throw new Error('Invalid data received from API');
        }
        
        setQuote({
          content: responseData.content,
          author: responseData.author,
          id: responseData._id
        });
        setLoading(false);
        return; // Success, exit the retry loop
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('All retry attempts failed:', errorMessage);
          setQuote({
            content: `Unable to fetch quote. Please check your internet connection and try again.`,
            author: 'System',
            id: 'error'
          });
          setLoading(false);
        } else {
          // Wait for 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  };

  useEffect(() => {
    fetchNewQuote();
    // Load favorites from localStorage only on client side
    if (typeof window !== 'undefined') {
      const savedFavorites = localStorage.getItem('favoriteQuotes');
      if (savedFavorites) {
        try {
          const parsed = JSON.parse(savedFavorites);
          setFavorites(parsed);
        } catch (e) {
          console.error('Error parsing favorites:', e);
          localStorage.removeItem('favoriteQuotes'); // Clear invalid data
        }
      }
    }
  }, []);

  // Add a client-side only state for loader
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const saveQuote = () => {
    if (!quote) return;
    
    const newFavorite = {
      ...quote,
      id: Date.now().toString() // Add unique ID for each saved quote
    };
    
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteQuotes', JSON.stringify(updatedFavorites));
  };

  const removeFromFavorites = (id: string) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteQuotes', JSON.stringify(updatedFavorites));
  };

  const getTwitterShareUrl = () => {
    if (!quote) return '#';
    const text = encodeURIComponent(`"${quote.content}" - ${quote.author}`);
    return `https://twitter.com/intent/tweet?text=${text}`;
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Daily Inspiration</h1>
        <div className={styles.quoteCard}>
          <div className={styles.quoteIcon}>"</div>
          {loading ? (
            <div className={styles.loadingContainer}>
              {isClient && <PulseLoader color="#6366f1" size={10} />}
            </div>
          ) : (
            <div className={styles.fadeIn}>
              <p className={styles.quoteText}>{quote?.content}</p>
              <p className={styles.author}>- {quote?.author}</p>
            </div>
          )}
        </div>
        <div className={styles.buttonContainer}>
          <button 
            className={styles.newQuoteButton}
            onClick={() => fetchNewQuote()}
            disabled={loading}
          >
            New Quote
          </button>
          <button 
            className={styles.saveButton}
            onClick={saveQuote}
            disabled={loading || !quote || favorites.some(fav => fav.content === quote.content)}
          >
            Save Quote
          </button>
          <a 
            href={getTwitterShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.twitterButton}
          >
            Share on Twitter
          </a>
        </div>

        {favorites.length > 0 && (
          <div className={styles.favoritesSection}>
            <h2 className={styles.favoritesTitle}>Favorite Quotes</h2>
            <div className={styles.favoritesList}>
              {favorites.map((fav) => (
                <div key={fav.id} className={styles.favoriteQuoteCard}>
                  <p className={styles.quoteText}>{fav.content}</p>
                  <p className={styles.author}>- {fav.author}</p>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeFromFavorites(fav.id!)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
