import { useState, useEffect } from "react";
import { User, Room } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import RoomBox from "../components/automation/RoomBox";
import AddRoomModal from "../components/automation/AddRoomModal";

export default function Automation() {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const roomsData = await Room.filter({ created_by: currentUser.email }, 'order', null);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
    setIsLoading(false);
  };
  
  const handleAddRoom = async (roomData) => {
    try {
      const newRoomData = { ...roomData, order: rooms.length, appliances: [] };
      await Room.create(newRoomData);
      loadRooms(); // Reload all rooms
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(rooms);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRooms(items);

    try {
      const updatePromises = items.map((room, index) =>
        Room.update(room.id, { order: index })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error saving room order:", error);
      loadRooms();
    }
  };

  const filteredRooms = rooms.filter(room => {
    return room.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 font-inter">Loading automation controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-inter">Room Automation</h1>
            <p className="text-gray-600 font-inter mt-1">Select a room to manage its devices and settings</p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 font-inter"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-inter"
          />
        </div>
      </div>

      {filteredRooms.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="rooms">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {filteredRooms.map((room, index) => (
                  <Draggable key={room.id} draggableId={room.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <RoomBox
                          room={room}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 font-inter mb-2">No rooms found</h3>
          <p className="text-gray-600 font-inter mb-4">
            {searchTerm ? "Try adjusting your search terms" : "Add your first room to get started"}
          </p>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 font-inter"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>
      )}

      <AddRoomModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddRoom}
      />
    </div>
  );
}