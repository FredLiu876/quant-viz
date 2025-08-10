import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from operators.basic import *


def closing_prices(stocks):
    """
    Downloads the closing prices for a list of stocks from Yahoo Finance.
    
    Parameters:
        stocks (list): A list of stock tickers.
    
    Returns:
        pandas.DataFrame: A DataFrame with the closing prices for each stock in the list.
    
    Notes:
        The start and end dates are hardcoded as "2020-10-01" and "2024-10-31" respectively.
        The function replaces missing values (NaNs) with 0.
    """
    data = yf.download(stocks, start="2020-10-01", end="2024-10-31")
    data.fillna(0, inplace=True)
    close_prices = data['Close']
    return close_prices


def pnl_calc(alpha_matrix, close_prices):
    """
    Calculate the daily, total daily, and total portfolio PnL (Profit and Loss) based on the given alpha matrix and closing prices.

    Parameters:
    alpha_matrix (np.ndarray): A 2D array where each element represents the alpha value (investment signal) for a stock on a given day.
    close_prices (np.ndarray): A 2D array where each element represents the closing price of a stock on a given day.

    Returns:
    tuple: A tuple containing:
        - daily_pnl (np.ndarray): The profit and loss for each stock on each day.
        - total_daily_pnl (np.ndarray): The total profit and loss for all stocks on each day.
        - total_pnl (float): The total profit and loss for all stocks over the entire period.

    Notes:
    - Needs to be more robust so that it doesn't result in bugs that go undetected. Need an automatic stock closing prices to alpha matrix alignment
    """

    price_changes = close_prices[:, 1:] - close_prices[:, :-1]
    daily_pnl = np.multiply(alpha_matrix[:, :-1], price_changes)  # Element-wise multiplication
    daily_pnl = np.round(daily_pnl, 2)
    total_daily_pnl = daily_pnl.sum(axis=0)
    total_pnl = total_daily_pnl.sum()
    
    return daily_pnl, total_daily_pnl, total_pnl


def count_transactions(alpha_matrix):
    """
    Counts the number of transactions (buys and sells) for each stock in a given alpha matrix, to approximate transaction fees.

    Parameters:
    alpha_matrix (np.matrix): A matrix containing alpha values for each stock on each day (rows for stocks, columns for days).

    Returns:
    np.array: An array containing the number of transactions for each stock.
    """

    padded_matrix = np.hstack([np.zeros((alpha_matrix.shape[0], 1)), alpha_matrix])
    differences = np.diff(padded_matrix, axis=1)
    
    # Count non-zero changes for each column (stock)
    position_changes = np.sum(differences != 0, axis=1)
    
    return position_changes


def visualize_alpha(stock, alpha_strategy):
    """
    Visualize the performance of an alpha strategy on a given stock.

    Parameters
    ----------
    stock : str
        The stock to visualize.
    alpha_strategy : function
        The alpha strategy to visualize

    Returns
    -------
    fig, ax : matplotlib.Figure, matplotlib.Axes
        The figure and axes of the plot. You can just immediately plt.show(), or you can use fig and ax to customize the graph further

    """

    capital = 10000

    close_prices = closing_prices([stock])
    alpha_matrix = alpha_strategy(close_prices, capital)
    close_prices = close_prices[stock]

    fig, ax = plt.subplots(figsize=(12, 8))
    ax.plot(close_prices.index, close_prices, label="Stock closing price")

    # Plot green if alpha matrix > 0, otherwise red
    alpha_matrix_plotted = pd.Series(alpha_matrix.tolist()[0], index=close_prices.index)
    buying_in = alpha_matrix_plotted > 0
    current_in_range = False
    for i, in_range in enumerate(buying_in):
        if in_range and not current_in_range:
            beginning_of_range = i
            current_in_range = True
        elif not in_range and current_in_range:
            current_in_range = False
            ax.axvspan(close_prices.index[beginning_of_range], close_prices.index[i], color='green', alpha=0.3)
    if current_in_range:
        ax.axvspan(close_prices.index[beginning_of_range], close_prices.index[-1], color='green', alpha=0.3)

    ax.set_xlabel('Date')
    ax.set_ylabel('Closing Price')
    ax.set_title(f'{stock} Closing Prices and Alpha Positions')
    ax.legend()
    return fig, ax


def test_versus_baseline(stocks, alpha_strategy):
    """
    Test a given alpha strategy against a baseline strategy of holding forever.

    Parameters:
    stocks (list): List of stock tickers to test.
    alpha_strategy (function): Alpha strategy to test.

    Returns:
    tuple: (total_pnl, total_pnl_baseline, percentage_improvement)

    Notes:
    - Baseline strategy should have multiple options, such as one to compare holding SPY forever. Should also model difference in variance, and other metrics that may matter beyond just pnl
    """
    capital = 10000
    close_prices = closing_prices(stocks)

    alpha_matrix = alpha_strategy(close_prices, capital)
    close_prices_matrix = np.matrix(close_prices).T
    daily_pnl, total_daily_pnl, total_pnl = pnl_calc(alpha_matrix, close_prices_matrix)
    transaction_costs = count_transactions(alpha_matrix)
    

    alpha_matrix_baseline = hold_indefinitely(close_prices, capital)
    close_prices_matrix_baseline = np.matrix(close_prices).T
    daily_pnl_baseline, total_daily_pnl_baseline, total_pnl_baseline = pnl_calc(alpha_matrix_baseline, close_prices_matrix_baseline)
    transaction_costs_baseline = count_transactions(alpha_matrix_baseline)

    return total_pnl, total_pnl_baseline, float(round((total_pnl / total_pnl_baseline) * 100, 2)), transaction_costs, transaction_costs_baseline                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

def format_results(results):
    """
    Formats the results of the test_versus_baseline function

    Parameters:
    results (tuple): Immediate returned results from test_versus_baseline function
    """

    total_pnl, total_pnl_baseline, percentage_improvement, transaction_costs, transaction_costs_baseline = results
    print("\n\nWhen using an initial capital of 10000...\n")
    print("RESULTS FROM THIS ALPHA:")
    print(f"Total PnL: {round(total_pnl, 2)}\n")
    print("COMPARED TO BASELINE OF HOLDING FOREVER:")
    print(f"Total PnL: {round(total_pnl_baseline, 2)}\n")
    print(f"PnL as a Percentage of the Baseline: {percentage_improvement}%")

    print(f"\n\nNumber of transactions for this alpha are: {np.sum(transaction_costs)}")
    print(f"Number of transactions for the baseline are: {np.sum(transaction_costs_baseline)}")