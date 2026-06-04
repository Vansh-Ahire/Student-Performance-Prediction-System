"""
Coding Statistics Scraper
Fetches user statistics from LeetCode, CodeChef, and HackerRank.
"""
import requests
from bs4 import BeautifulSoup
import json
import re

def extract_username(input_str):
    if not input_str: return ""
    input_str = input_str.strip().rstrip('/')
    return input_str.split('/')[-1]

def fetch_leetcode_stats(username):
    username = extract_username(username)
    if not username: return None
    url = "https://leetcode.com/graphql"
    query = {
        "query": """
        query userProblemsSolved($username: String!) {
          allQuestionsCount {
            difficulty
            count
          }
          matchedUser(username: $username) {
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
        """,
        "variables": {"username": username}
    }
    try:
        response = requests.post(url, json=query, timeout=10)
        data = response.json()
        if 'data' in data and data['data']['matchedUser']:
            stats = data['data']['matchedUser']['submitStatsGlobal']['acSubmissionNum']
            total_solved = next(s['count'] for s in stats if s['difficulty'] == 'All')
            return {
                "platform": "LeetCode",
                "problems_solved": total_solved,
                "rating": 0 # LeetCode rating requires another query, keeping it simple for now
            }
    except Exception as e:
        print(f"Error fetching LeetCode stats: {e}")
    return None

def fetch_codechef_stats(username):
    username = extract_username(username)
    if not username: return None
    url = f"https://www.codechef.com/users/{username}"
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        rating_section = soup.find('div', class_='rating-number')
        rating = int(rating_section.text) if rating_section else 0
        
        # CodeChef often has "Fully Solved (286)" or similar
        solved_text = soup.find(string=re.compile(r'Fully Solved \(\d+\)'))
        solved_count = 0
        if solved_text:
            match = re.search(r'\((\d+)\)', solved_text)
            if match:
                solved_count = int(match.group(1))
        else:
            # Fallback check
            h3_solved = soup.find('h3', string=re.compile(r'Total Problems Solved'))
            if h3_solved:
                solved_count = int(re.search(r'\d+', h3_solved.text).group())
        
        return {
            "platform": "CodeChef",
            "problems_solved": solved_count,
            "rating": rating
        }
    except Exception as e:
        print(f"Error fetching CodeChef stats: {e}")
    return None

def fetch_hackerrank_stats(username):
    username = extract_username(username)
    if not username: return None
    # HackerRank is harder to scrape due to dynamic content, 
    # but we can try a basic approach or mock if it fails.
    url = f"https://www.hackerrank.com/{username}"
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        # HackerRank often blocks simple scrapers. 
        # If it fails, we might need a different approach or just return what we have.
        if response.status_code == 200:
            # Basic check for profile existance
            return {
                "platform": "HackerRank",
                "problems_solved": 0, # Hard to get without JS rendering
                "rating": 0
            }
    except Exception as e:
        print(f"Error fetching HackerRank stats: {e}")
    return None

def sync_all_stats(user):
    stats = []
    
    lc = fetch_leetcode_stats(user.leetcode)
    if lc: stats.append(lc)
    
    cc = fetch_codechef_stats(user.codechef)
    if cc: stats.append(cc)
    
    # hr = fetch_hackerrank_stats(user.hackerrank)
    # if hr: stats.append(hr)
    
    return stats
