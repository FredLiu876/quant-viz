export const DEFAULT_CODE = `# Write Python here.
# Press ⌘/Ctrl+Enter or press the button to run.

from functools import partial
import numpy as np
import sys
import os

def buy(capital, current_stock_price):
    """
    Calculate the number of shares to buy with the given capital at the current stock price.

    Parameters:
    capital (float): The amount of money available to invest. Must be non-negative.
    current_stock_price (float): The price of a single share of the stock.

    Returns:
    float: The number of shares that can be purchased with the given capital.

    Notes:
    - Still needs to model the transaction costs
    """

    assert capital >= 0, "Capital is negative! Revisit for bugs or maybe this alpha is gonna make u bankrupt"
    shares_to_buy = capital/current_stock_price
    return shares_to_buy

def alpha_strategy_dev(short_term_ma_days, long_term_ma_days, close_prices, capital):
    """
    Creates an alpha matrix based on a simple moving average crossover strategy,
    by holding when short term moving average exceeds long term moving average and selling when it drops below the long term moving average

    Parameters
    ----------
    short_term_ma_days : int
        The number of days to use for the short term moving average
    long_term_ma_days : int
        The number of days to use for the long term moving average
    close_prices : pandas.DataFrame
        The closing prices of all stocks
    capital : float
        The total amount of capital to use

    Returns
    -------
    numpy.matrix
        The alpha matrix
    """
    use_stop_loss = False
    all_stocks = list(close_prices.columns)
    alpha_matrix = []
    for col in all_stocks:
        short_term_ma = list(close_prices[col].rolling(window=short_term_ma_days).mean())
        long_term_ma = list(close_prices[col].rolling(window=long_term_ma_days).mean())
    
        day_over_day = list(close_prices[col])
        stocks_per_day = []
        holding = False
        index_of_last_reversal = 0
        for i in range(len(day_over_day)):
            if day_over_day[i] == 0:
                stocks_per_day.append(0)
                continue
            
            # Check if both moving averages exist first
            if np.isnan(short_term_ma[i]) or np.isnan(long_term_ma[i]) or capital <= 0:
                stocks_per_day.append(0)
                continue

            if short_term_ma[i] > long_term_ma[i]:
                if holding:
                    if use_stop_loss and day_over_day[i - 1] / maximum_of_this_holding < 0.90:
                        print("Used stop loss")
                        capital += stocks_per_day[-1] * (day_over_day[i] - day_over_day[index_of_last_reversal])
                        stocks_per_day.append(0)
                        holding = False
                        index_of_last_reversal = i
                    else:
                        maximum_of_this_holding = max(day_over_day[i], maximum_of_this_holding)
                        stocks_per_day.append(stocks_per_day[-1])
                else:
                    if index_of_last_reversal != 0:
                        capital += stocks_per_day[-1] * (day_over_day[i] - day_over_day[index_of_last_reversal])
                    stocks_per_day.append(buy(capital, day_over_day[i]))
                    maximum_of_this_holding = day_over_day[i]
                    holding = True
                    index_of_last_reversal = i
                
            else:
                if holding:
                    if index_of_last_reversal != 0:
                        capital += stocks_per_day[-1] * (day_over_day[i] - day_over_day[index_of_last_reversal])
                    # stocks_per_day.append(short(capital, day_over_day[i]))
                    stocks_per_day.append(0)
                    holding = False
                    index_of_last_reversal = i
                else:
                    if stocks_per_day == []:
                        stocks_per_day.append(0)
                    else:
                        stocks_per_day.append(stocks_per_day[-1])

        alpha_matrix.append(stocks_per_day)

    return np.matrix(alpha_matrix)

alpha_strategy = partial(alpha_strategy_dev, 20, 50)
`;