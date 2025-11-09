import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Upload,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CreateVoteForm = ({ onClose }: { onClose: () => void }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    options: [{ name: "", image: "", details: "" }],
    classes: [] as string[],
    departments: [] as string[],
    year: "",
    gpsEnabled: false,
    gpsCenter: "",
    gpsRadius: "100",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    timezone: "UTC",
    allowChanges: false,
    showLiveResults: false,
    enableDiscussions: true,
  });

  const totalSteps = 6;

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { name: "", image: "", details: "" }],
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    toast({
      title: "Vote Created Successfully! 🎉",
      description: "Your voting session has been scheduled",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Vote</h2>
              <p className="text-white/70">
                Step {step} of {totalSteps}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="title" className="text-white">
                    Vote Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Class Representative Election 2025"
                    className="mt-2 bg-white/10 border-white/30 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the purpose and details of this vote..."
                    className="mt-2 bg-white/10 border-white/30 text-white min-h-[120px]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-white">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="mt-2 bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/30">
                      <SelectItem value="election">Election</SelectItem>
                      <SelectItem value="survey">Survey</SelectItem>
                      <SelectItem value="poll">Poll</SelectItem>
                      <SelectItem value="award">Award</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white">
                  Options / Candidates
                </h3>

                {formData.options.map((option, index) => (
                  <Card key={index} className="glass-card border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-medium">Option {index + 1}</h4>
                        {formData.options.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                            className="text-error hover:bg-error/10 h-auto p-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Input
                          placeholder="Option name (e.g., Sarah Johnson)"
                          value={option.name}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index].name = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          className="bg-white/10 border-white/30 text-white"
                        />

                        <Input
                          placeholder="Additional details (e.g., Class 10A, Roll No: 101)"
                          value={option.details}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index].details = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          className="bg-white/10 border-white/30 text-white"
                        />

                        <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                          <Upload className="w-6 h-6 text-white/50 mx-auto mb-2" />
                          <p className="text-sm text-white/70">Upload image (optional)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={handleAddOption}
                  className="w-full border-white/30 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-white">
                  Eligibility Criteria
                </h3>

                <div>
                  <Label className="text-white mb-3 block">
                    Classes (Select multiple)
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["10A", "10B", "11A", "11B", "12A", "12B"].map((cls) => (
                      <div
                        key={cls}
                        className="flex items-center space-x-2 p-2 rounded bg-white/5"
                      >
                        <Checkbox
                          id={cls}
                          checked={formData.classes.includes(cls)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                classes: [...formData.classes, cls],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                classes: formData.classes.filter((c) => c !== cls),
                              });
                            }
                          }}
                          className="border-white/30"
                        />
                        <label htmlFor={cls} className="text-white text-sm cursor-pointer">
                          Class {cls}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block">Departments</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Computer Science", "Mathematics", "Physics", "Chemistry"].map(
                      (dept) => (
                        <div
                          key={dept}
                          className="flex items-center space-x-2 p-2 rounded bg-white/5"
                        >
                          <Checkbox
                            id={dept}
                            checked={formData.departments.includes(dept)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  departments: [...formData.departments, dept],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  departments: formData.departments.filter(
                                    (d) => d !== dept
                                  ),
                                });
                              }
                            }}
                            className="border-white/30"
                          />
                          <label
                            htmlFor={dept}
                            className="text-white text-sm cursor-pointer"
                          >
                            {dept}
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">GPS Verification</Label>
                      <p className="text-sm text-white/70 mt-1">
                        Require users to be in a specific location
                      </p>
                    </div>
                    <Checkbox
                      checked={formData.gpsEnabled}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, gpsEnabled: !!checked })
                      }
                      className="border-white/30"
                    />
                  </div>

                  {formData.gpsEnabled && (
                    <div className="space-y-3 pt-3 border-t border-white/20">
                      <div>
                        <Label className="text-white">Center Location</Label>
                        <div className="mt-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-white/50" />
                          <Input
                            placeholder="University Campus, Building A"
                            value={formData.gpsCenter}
                            onChange={(e) =>
                              setFormData({ ...formData, gpsCenter: e.target.value })
                            }
                            className="flex-1 bg-white/10 border-white/30 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white">Radius (meters)</Label>
                        <Input
                          type="number"
                          value={formData.gpsRadius}
                          onChange={(e) =>
                            setFormData({ ...formData, gpsRadius: e.target.value })
                          }
                          className="mt-2 bg-white/10 border-white/30 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-white">Scheduling</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="mt-2 bg-white/10 border-white/30 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white">Start Time *</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="mt-2 bg-white/10 border-white/30 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white">End Date *</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="mt-2 bg-white/10 border-white/30 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white">End Time *</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="mt-2 bg-white/10 border-white/30 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timezone: value })
                    }
                  >
                    <SelectTrigger className="mt-2 bg-white/10 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/30">
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">EST</SelectItem>
                      <SelectItem value="PST">PST</SelectItem>
                      <SelectItem value="IST">IST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white">Settings</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/20">
                    <div>
                      <Label className="text-white">Allow Vote Changes</Label>
                      <p className="text-sm text-white/70">
                        Users can change their vote before deadline
                      </p>
                    </div>
                    <Checkbox
                      checked={formData.allowChanges}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, allowChanges: !!checked })
                      }
                      className="border-white/30"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/20">
                    <div>
                      <Label className="text-white">Show Live Results</Label>
                      <p className="text-sm text-white/70">
                        Display results as votes are cast
                      </p>
                    </div>
                    <Checkbox
                      checked={formData.showLiveResults}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, showLiveResults: !!checked })
                      }
                      className="border-white/30"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/20">
                    <div>
                      <Label className="text-white">Enable Discussions</Label>
                      <p className="text-sm text-white/70">
                        Allow users to comment on the vote
                      </p>
                    </div>
                    <Checkbox
                      checked={formData.enableDiscussions}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enableDiscussions: !!checked })
                      }
                      className="border-white/30"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-center mb-6">
                  <CheckCircle className="w-16 h-16 text-success" />
                </div>

                <h3 className="text-2xl font-bold text-white text-center">
                  Review & Launch
                </h3>

                <Card className="glass-card border-white/20">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-white/70 text-sm">Title</p>
                      <p className="text-white font-semibold">{formData.title}</p>
                    </div>

                    <div>
                      <p className="text-white/70 text-sm">Options</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.options.map((option, index) => (
                          <Badge key={index} className="bg-primary text-white">
                            {option.name || `Option ${index + 1}`}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-white/70 text-sm">Duration</p>
                      <p className="text-white font-semibold">
                        {formData.startDate} - {formData.endDate}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/70 text-sm">Eligibility</p>
                      <p className="text-white font-semibold">
                        {formData.classes.length} classes, {formData.departments.length}{" "}
                        departments
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/20">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="border-white/30 text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-success hover:bg-success/90"
              >
                Launch Vote
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
