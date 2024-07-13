import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './DishDashboard.css';

const DishDashboard = () => {
    const [dishes, setDishes] = useState([]);

    // handling web socket for real-time update
    useEffect(() => {
        fetchDishes();

        const socket = new SockJS('http://localhost:8010/websocket');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: () => {
                stompClient.subscribe('/topic/dishes', (message) => {
                    const updatedDish = JSON.parse(message.body);
                    setDishes((prevDishes) =>
                        prevDishes.map(dish => dish.dishId === updatedDish.dishId ? updatedDish : dish)
                    );
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, []);

    // fetching dishes from database
    const fetchDishes = async () => {
        try {
            const response = await axios.get('http://localhost:8010/api/dishes');
            setDishes(response.data);
        } catch (error) {
            console.error('Error fetching dishes:', error);
        }
    };

    // handle toggle real-time update
    const togglePublishedStatus = async (dishId) => {
        try {
            await axios.post(`http://localhost:8010/api/dishes/${dishId}/toggle`);
            setDishes((prevDishes) =>
            prevDishes.map(dish =>
                dish.dishId === dishId ? { ...dish, isPublished: !dish.isPublished } : dish 
            )
        );
        toast.success('Dish status updated successfully');
        } catch (error) {
            console.error('Error toggling dish status:', error);
            toast.error('Failed to update dish status');
        }
    };


    return (
        <div className="dashboard-container">
            <ToastContainer />
            <div className="dishes-grid">
                {dishes.map(dish => (
                    <div className="dish-card" key={dish.dishId}>
                        <img className="dish-image" src={dish.imageUrl} alt={dish.dishName} />
                        <div className="dish-info">
                            <h3 className="dish-name">{dish.dishName}</h3>
                        </div>
                        <button
                            className={`toggle-button ${dish.isPublished ? 'published' : 'unpublished'}`}
                            onClick={() => togglePublishedStatus(dish.dishId)}
                        >
                            {dish.isPublished ? 'Published' : 'Publish'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DishDashboard;
